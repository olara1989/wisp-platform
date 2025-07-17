import { NextResponse } from "next/server";
import { createServerSupabaseClient, getCurrentUserRole } from "@/lib/supabase";
import { headers } from "next/headers";

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  estado: string;
  plan: string;
  fecha_alta: string;
  region: string;
}

interface Pago {
  mes: number | string;
  anio: number | string;
}

function getMesYAnoParaVerificarFromDate(date: Date) {
  const dia = date.getDate();
  let mes = date.getMonth() + 1; // 1-12
  let anio = date.getFullYear();
  if (dia < 5) {
    mes = mes - 1;
    if (mes === 0) {
      mes = 12;
      anio = anio - 1;
    }
  }
  return { mes, anio };
}

function getMesesPendientes(
  clienteId: string,
  primerMes: number,
  primerAnio: number,
  mesActual: number,
  anioActual: number,
  pagos: Pago[]
) {
  const pendientes: string[] = [];
  let m = primerMes;
  let a = primerAnio;
  while (a < anioActual || (a === anioActual && m <= mesActual)) {
    const tienePago = pagos.some(
      (p) => Number(p.mes) === m && Number(p.anio) === a
    );
    if (!tienePago) {
      pendientes.push(`${m.toString().padStart(2, "0")}/${a}`);
    }
    m++;
    if (m > 12) {
      m = 1;
      a++;
    }
  }
  return pendientes;
}

async function getClientesSinPagoDelMes(mesActual: number, anioActual: number) {
  const supabase = createServerSupabaseClient();

  const { data: clientes, error: errorClientes } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, email, estado, plan, fecha_alta, region")
    .eq("estado", "activo")
    .returns<Cliente[]>();

  if (errorClientes || !clientes) {
    console.error("Error fetching active clients:", errorClientes);
    return [];
  }

  const clientesConPendientes: (Cliente & { mesesPendientes: string[] })[] = [];
  for (const cliente of clientes) {
    const { data: pagos, error: errorPagos } = await supabase
      .from("pagos")
      .select("mes, anio")
      .eq("cliente_id", cliente.id)
      .returns<Pago[]>();

    if (errorPagos) {
      console.error("Error fetching payments for client", cliente.id, errorPagos);
      continue;
    }

    const fechaAltaStr =
      typeof cliente.fecha_alta === "string" ? cliente.fecha_alta : "";
    const fechaAlta = new Date(fechaAltaStr);
    const primerMes = fechaAlta.getMonth() + 1;
    const primerAnio = fechaAlta.getFullYear();

    const mesesPendientes = getMesesPendientes(
      String(cliente.id),
      primerMes,
      primerAnio,
      mesActual,
      anioActual,
      pagos || []
    );

    if (mesesPendientes.length > 0) {
      clientesConPendientes.push({ ...cliente, mesesPendientes });
    }
  }
  return clientesConPendientes;
}

export async function GET(request: Request) {
  try {
    const userRole = await getCurrentUserRole();

    if (userRole !== "admin" && userRole !== "cajero") {
      return NextResponse.json({ error: "Acceso no autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const regionFiltro = searchParams.get("region") || "";
    const mesesFiltro = Number(searchParams.get("meses")) || 0;

    const fechaReferencia = new Date();
    const { mes: mesActual, anio: anioActual } =
      getMesYAnoParaVerificarFromDate(fechaReferencia);

    let clientesMorosos = await getClientesSinPagoDelMes(mesActual, anioActual);

    if (regionFiltro) {
      clientesMorosos = clientesMorosos.filter(
        (c) => c.region === regionFiltro
      );
    }
    if (mesesFiltro > 0) {
      clientesMorosos = clientesMorosos.filter(
        (c) =>
          Array.isArray(c.mesesPendientes) &&
          c.mesesPendientes.length === mesesFiltro
      );
    }

    return NextResponse.json(clientesMorosos);
  } catch (error: any) {
    console.error("Error in API route /api/cortes:", error);
    return NextResponse.json(
      { error: error.message, details: error.stack },
      { status: 500 }
    );
  }
} 