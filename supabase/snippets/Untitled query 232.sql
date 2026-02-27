CREATE TABLE historial_operaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mercado_id UUID REFERENCES mercados(id),
  tipo_voto TEXT, -- 'SI' o 'NO'
  precio_pagado NUMERIC,
  creado_at TIMESTAMPTZ DEFAULT now()
);