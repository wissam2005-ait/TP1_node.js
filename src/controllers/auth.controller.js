export function createAuthController({ authService }) {
  return {
    async login(req, res) {
      const { email, password } = req.validated;
      res.json(await authService.login(email, password));
    },
    
    async refresh(req, res) {
      res.json(await authService.refresh(req.validated.refresh_token));
    },
    
    async register(req, res) {
      res.status(201).json(await authService.register(req.validated));
    },
    
    me(req, res) {
      res.json(req.user); // l'utilisateur est injecté par le middleware requireAuth
    },
  };
}