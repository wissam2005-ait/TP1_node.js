import Joi from "joi";

export const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(500).default(50),
  offset: Joi.number().integer().min(0).default(0),
});

export const measureSchema = Joi.object({
  hive_id: Joi.string(),
  site_id: Joi.string(),
  timestamp: Joi.date().iso().required(),
  position_lat: Joi.number().min(-90).max(90).allow(null),
  position_lon: Joi.number().min(-180).max(180).allow(null),
  weight_kg: Joi.number().min(0).max(150).required(),
  temp_internal_c: Joi.number().min(-10).max(60).allow(null),
  temp_external_c: Joi.number().min(-20).max(60).allow(null),
  humidity_pct: Joi.number().integer().min(0).max(100).allow(null),
  acoustic_activity_score: Joi.number().min(0).max(1).allow(null),
  battery_pct: Joi.number().integer().min(0).max(100).allow(null),
});

export const hivesQuerySchema = Joi.object({
  site_id: Joi.string(),
});

export const inspectionSchema = Joi.object({
  id: Joi.string().guid().required(),
  hive_id: Joi.string(),
  inspected_at: Joi.date().iso().max("now").required(),
  colony_status: Joi.string().valid("forte", "normale", "faible", "morte").required(),
  queen_present: Joi.boolean().allow(null),
  observations: Joi.string().max(2000).allow("", null),
});