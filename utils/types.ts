export interface Mercado {
  id: string;
  titulo: string;
  imagen_url: string | null;
  precio_si: number;
  precio_no: number;
  finalizado: boolean;
  resultado?: 'si' | 'no';
  descripcion: string | null;
  categoria: string | null;
}

export interface HistorialOperacion {
  id: string;
  mercado_id: string;
  tipo_voto: 'si' | 'no';
  precio_pagado: number;
  wallet_address?: string;
  pagado?: boolean;
  monto_ganado?: number;
  creado_at?: string;
}
