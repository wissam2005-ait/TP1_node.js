import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors.js";

const INVALID_CREDENTIALS = "Adresse e-mail ou mot de passe incorrect.";
const DUMMY_HASH = bcrypt.hashSync("mot-de-passe-factice", 10);

const ISSUER = "queenbee-api";
const AUDIENCE = "queenbee";
const ALGORITHM = "HS256";

export function createAuthService({ usersRepository, auth }) {
  // Crée une paire de jetons (accès + rafraîchissement)
  function issueTokens(user) {
    const options = { algorithm: ALGORITHM, issuer: ISSUER, audience: AUDIENCE, subject: user.id };
    return {
      token_type: "Bearer",
      access_token: jwt.sign({ type: "access", role: user.role, site_id: user.site_id }, auth.accessSecret, {
        ...options, expiresIn: auth.accessTtl,
      }),
      refresh_token: jwt.sign({ type: "refresh" }, auth.refreshSecret, { ...options, expiresIn: auth.refreshTtl }),
    };
  }

  // Vérifie un jeton et son type (access ou refresh)
  function verify(token, secret, expectedType) {
    try {
      const payload = jwt.verify(token, secret, { algorithms: [ALGORITHM], issuer: ISSUER, audience: AUDIENCE });
      return payload.type === expectedType ? payload : null;
    } catch {
      return null;
    }
  }

  // Message si le compte est bloqué
  function lockedMessage(lockedUntil) {
    const heure = lockedUntil.toISOString().slice(11, 16);
    return `Compte bloqué après ${auth.maxFailedLogins} échecs de connexion, jusqu'à ${heure} UTC.`;
  }

  return {
    async login(email, password) {
      const user = await usersRepository.findByEmail(email.toLowerCase());
      if (!user) {
        await bcrypt.compare(password, DUMMY_HASH); // Sécurité : on simule un temps de réponse
        throw new UnauthorizedError(INVALID_CREDENTIALS);
      }
      if (user.locked_until && user.locked_until > new Date()) {
        throw new UnauthorizedError(lockedMessage(user.locked_until));
      }
      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) {
        const lockedUntil = await usersRepository.recordFailedLogin(user.id, auth.maxFailedLogins, auth.lockMinutes);
        throw new UnauthorizedError(lockedUntil ? lockedMessage(lockedUntil) : INVALID_CREDENTIALS);
      }
      await usersRepository.resetFailedLogins(user.id);
      return issueTokens(user);
    },

    async refresh(refreshToken) {
      const payload = verify(refreshToken, auth.refreshSecret, "refresh");
      if (!payload) throw new UnauthorizedError("Jeton de renouvellement invalide ou expiré.");
      
      const user = await usersRepository.findById(payload.sub);
      if (!user) throw new UnauthorizedError("Utilisateur inconnu.");
      
      return issueTokens(user);
    },

    async register({ email, password, role, site_id }) {
      const password_hash = await bcrypt.hash(password, 10);
      return usersRepository.create({ email: email.toLowerCase(), password_hash, role, site_id });
    },

    verifyAccessToken(token) {
      const payload = verify(token, auth.accessSecret, "access");
      if (!payload) {
        throw new UnauthorizedError("Jeton d'accès invalide ou expiré.");
      }
      return { id: payload.sub, role: payload.role, site_id: payload.site_id };
    },
  };
}