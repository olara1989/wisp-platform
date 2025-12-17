-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  telefono text,
  email text,
  direccion text,
  latitud double precision,
  longitud double precision,
  fecha_alta date DEFAULT CURRENT_DATE,
  estado USER-DEFINED,
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  region USER-DEFINED DEFAULT 'La Victoria'::region,
  ip real,
  ubicacion text,
  plan uuid,
  antena USER-DEFINED,
  db smallint,
  prestada boolean,
  alias text,
  CONSTRAINT clientes_pkey PRIMARY KEY (id),
  CONSTRAINT clientes_plan_fkey FOREIGN KEY (plan) REFERENCES public.planes(id)
);
CREATE TABLE public.dispositivos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  ip text,
  mac text,
  interface text,
  router_id uuid,
  modo_control text CHECK (modo_control = ANY (ARRAY['queue'::text, 'hotspot'::text, 'pppoe'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dispositivos_pkey PRIMARY KEY (id),
  CONSTRAINT dispositivos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT dispositivos_router_id_fkey FOREIGN KEY (router_id) REFERENCES public.routers(id)
);
CREATE TABLE public.pagos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  cliente_id uuid NOT NULL,
  fecha_pago date DEFAULT CURRENT_DATE,
  monto numeric NOT NULL,
  metodo text NOT NULL,
  referencia text,
  notas text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mes smallint,
  anio integer,
  CONSTRAINT pagos_pkey PRIMARY KEY (id),
  CONSTRAINT pagos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);
CREATE TABLE public.planes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  precio numeric NOT NULL,
  subida integer NOT NULL,
  bajada integer NOT NULL,
  burst_subida integer,
  burst_bajada integer,
  tiempo_burst integer,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT planes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.routers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  ip text NOT NULL,
  usuario text NOT NULL,
  password text NOT NULL,
  puerto_api integer DEFAULT 8728,
  modo_control text NOT NULL CHECK (modo_control = ANY (ARRAY['queue'::text, 'pppoe'::text, 'firewall'::text, 'hotspot'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT routers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre text NOT NULL,
  rol text NOT NULL CHECK (rol = ANY (ARRAY['admin'::text, 'tecnico'::text, 'cajero'::text])),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id)
);