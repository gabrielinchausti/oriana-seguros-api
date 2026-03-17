export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Usar POST",
    });
  }

  try {
    const { prima_A, deducible_A, prima_B, deducible_B } = req.body || {};

    const pA = Number(prima_A);
    const dA = Number(deducible_A);
    const pB = Number(prima_B);
    const dB = Number(deducible_B);

    const valores = [pA, dA, pB, dB];

    if (valores.some(v => isNaN(v) || v < 0)) {
      return res.status(400).json({
        error: "Parámetros inválidos"
      });
    }

    // Parámetros fijos
    const N_C = 63;
    const P_C = 0.05;

    const N_D = 37;
    const P_D = 0.25;

    const COSTO = 200;

    function acepta(prima, deducible, p) {
      return prima <= p * (COSTO - deducible);
    }

    function costoEsperado(prima, deducible, p) {
      return prima + p * deducible;
    }

    // Aceptación
    const aA_C = acepta(pA, dA, P_C);
    const aB_C = acepta(pB, dB, P_C);

    const aA_D = acepta(pA, dA, P_D);
    const aB_D = acepta(pB, dB, P_D);

    // Participación
    const compraC = aA_C || aB_C;
    const compraD = aA_D || aB_D;

    if (!compraC || !compraD) {
      let noCompran = 0;
      if (!compraC) noCompran += N_C;
      if (!compraD) noCompran += N_D;

      return res.status(200).json({
        status: "no_sale",
        clientes_no_compran: noCompran
      });
    }

    // Elección
    function elegir(aA, aB, p) {
      if (aA && !aB) return "A";
      if (!aA && aB) return "B";

      const cA = costoEsperado(pA, dA, p);
      const cB = costoEsperado(pB, dB, p);

      if (cA < cB) return "A";
      if (cB < cA) return "B";

      if (dA < dB) return "A";
      if (dB < dA) return "B";

      return "A";
    }

    const eleccionC = elegir(aA_C, aB_C, P_C);
    const eleccionD = elegir(aA_D, aB_D, P_D);

    let clientesA = 0;
    let clientesB = 0;

    let cA_C = 0, cB_C = 0;
    let cA_D = 0, cB_D = 0;

    if (eleccionC === "A") {
      clientesA += N_C;
      cA_C = N_C;
    } else {
      clientesB += N_C;
      cB_C = N_C;
    }

    if (eleccionD === "A") {
      clientesA += N_D;
      cA_D = N_D;
    } else {
      clientesB += N_D;
      cB_D = N_D;
    }

    // Roturas
    const rotA = 0.05 * cA_C + 0.25 * cA_D;
    const rotB = 0.05 * cB_C + 0.25 * cB_D;

    // Ganancia
    const primas = pA * clientesA + pB * clientesB;

    const costos =
      (COSTO - dA) * rotA +
      (COSTO - dB) * rotB;

    const ganancia = primas - costos;

    return res.status(200).json({
      status: "full_sale",
      clientes_plan_A: clientesA,
      clientes_plan_B: clientesB,
      clientes_no_compran: 0,
      roturas_A: rotA,
      roturas_B: rotB,
      ganancia: ganancia
    });

  } catch (e) {
    return res.status(500).json({
      error: "Error interno"
    });
  }
}
