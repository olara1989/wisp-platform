import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

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
  try {
    const clientesRef = collection(db, "clientes");
    const q = query(clientesRef, where("estado", "==", "activo"));
    const querySnapshot = await getDocs(q);

    const clientes: Cliente[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Cliente));

    const clientesConPendientes: (Cliente & { mesesPendientes: string[] })[] = [];

    for (const cliente of clientes) {
      const pagosRef = collection(db, "pagos");
      const qPagos = query(pagosRef, where("cliente_id", "==", cliente.id));
      const pagosSnap = await getDocs(qPagos);
      const pagos = pagosSnap.docs.map(doc => doc.data() as Pago);

      const fechaAltaStr =
        typeof cliente.fecha_alta === "string" ? cliente.fecha_alta : "";
      const fechaAlta = new Date(fechaAltaStr);

      // Basic validation for fechaAlta
      if (isNaN(fechaAlta.getTime())) {
        console.warn(`Fecha alta invalida para cliente ${cliente.id}, saltando.`);
        continue;
      }

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
  } catch (err) {
    console.error("Error in getClientesSinPagoDelMes:", err);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    // Note: Server-side auth check removed due to client SDK usage.
    // Use Firebase Admin SDK for auth verification in production.

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
