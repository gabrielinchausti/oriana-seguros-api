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

    // Elección: ahora puede devolver null si no acepta ningún plan
    function elegir(aA, aB, p) {
      if (!aA && !aB) return null;
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
    let clientesNoCompran = 0;

    let cA_C = 0, cB_C = 0;
    let cA_D = 0, cB_D = 0;

    // Cuidadosos
    if (eleccionC === "A") {
      clientesA += N_C;
      cA_C = N_C;
    } else if (eleccionC === "B") {
      clientesB += N_C;
      cB_C = N_C;
    } else {
      clientesNoCompran += N_C;
    }

    // Descuidados
    if (eleccionD === "A") {
      clientesA += N_D;
      cA_D = N_D;
    } else if (eleccionD === "B") {
      clientesB += N_D;
      cB_D = N_D;
    } else {
      clientesNoCompran += N_D;
    }

    // Roturas: solo sobre quienes compran
    const rotA = 0.05 * cA_C + 0.25 * cA_D;
    const rotB = 0.05 * cB_C + 0.25 * cB_D;

    // Ganancia: solo sobre quienes compran
    const primas = pA * clientesA + pB * clientesB;

    const costos =
      (COSTO - dA) * rotA +
      (COSTO - dB) * rotB;

    const ganancia = primas - costos;

    // Status interpretativo
    let status = "full_sale";
    if (clientesNoCompran === 100) {
      status = "no_sale";
    } else if (clientesNoCompran > 0) {
      status = "partial_sale";
    }

    return res.status(200).json({
      status: status,
      clientes_plan_A: clientesA,
      clientes_plan_B: clientesB,
      clientes_no_compran: clientesNoCompran,
      roturas_A: rotA,
      roturas_B: rotB,
      ganancia: ganancia,
      api_test: "VINO_DE_VERCEL_12345"
    });

  } catch (e) {
    return res.status(500).json({
      error: "Error interno"
    });
  }
}
