import { describe, it, expect } from "vitest";
import {
  calculateWorkoutXp,
  getAttributeForSessionType,
  calculateAttributeLevel,
  calculateCharacterLevel,
  calculateSkillPointsGained,
  determineDominantClass,
  applyClassInertia,
  calculateWeaponXpFromKills,
  calculateWeaponLevel,
  calculateWeaponDamage,
  type AttributeLevels,
  type ClassInertiaState,
} from "./xp";

describe("calculateWorkoutXp", () => {
  it("da XP proporcional a la duración sin repeticiones recientes", () => {
    expect(calculateWorkoutXp(60, 0)).toBe(600);
  });

  it("reduce el XP con diminishing returns al repetir tipo", () => {
    const sinRepetir = calculateWorkoutXp(60, 0);
    const conRepetir = calculateWorkoutXp(60, 3);
    expect(conRepetir).toBeLessThan(sinRepetir);
  });

  it("nunca baja del multiplicador mínimo aunque haya muchas repeticiones", () => {
    const conMuchasRepeticiones = calculateWorkoutXp(60, 20);
    expect(conMuchasRepeticiones).toBe(Math.round(600 * 0.4));
  });
});

describe("getAttributeForSessionType", () => {
  it("mapea cada tipo de sesión a su atributo correspondiente", () => {
    expect(getAttributeForSessionType("WEIGHTS")).toBe("STRENGTH");
    expect(getAttributeForSessionType("CARDIO")).toBe("ENDURANCE");
    expect(getAttributeForSessionType("CALISTHENICS")).toBe("AGILITY");
    expect(getAttributeForSessionType("SPORT")).toBe("DEXTERITY");
  });
});

describe("calculateAttributeLevel", () => {
  it("empieza en nivel 1 con 0 XP", () => {
    expect(calculateAttributeLevel(0)).toBe(1);
  });

  it("sube de nivel al alcanzar el XP requerido", () => {
    expect(calculateAttributeLevel(99)).toBe(1);
    expect(calculateAttributeLevel(100)).toBe(2);
  });
});

describe("calculateCharacterLevel", () => {
  it("da nivel 1 si no hay atributos", () => {
    expect(calculateCharacterLevel([])).toBe(1);
  });

  it("calcula la media redondeada hacia abajo", () => {
    expect(calculateCharacterLevel([2, 2, 2, 2, 2])).toBe(2);
    expect(calculateCharacterLevel([1, 2, 3, 4, 5])).toBe(3);
    expect(calculateCharacterLevel([1, 1, 1, 1, 2])).toBe(1);
  });
});

describe("calculateSkillPointsGained", () => {
  it("da 0 puntos si no ha subido de nivel", () => {
    expect(calculateSkillPointsGained(3, 3)).toBe(0);
  });

  it("da un punto por cada nivel ganado", () => {
    expect(calculateSkillPointsGained(3, 5)).toBe(2);
  });
});

describe("determineDominantClass", () => {
  it("devuelve PALADIN si los atributos están equilibrados", () => {
    const levels: AttributeLevels = {
      STRENGTH: 5,
      ENDURANCE: 5,
      AGILITY: 5,
      DEXTERITY: 5,
      VITALITY: 5,
    };
    expect(determineDominantClass(levels)).toBe("PALADIN");
  });

  it("devuelve WARRIOR si Fuerza domina claramente", () => {
    const levels: AttributeLevels = {
      STRENGTH: 10,
      ENDURANCE: 3,
      AGILITY: 3,
      DEXTERITY: 3,
      VITALITY: 3,
    };
    expect(determineDominantClass(levels)).toBe("WARRIOR");
  });
});

describe("applyClassInertia", () => {
  const baseState: ClassInertiaState = {
    currentClass: "PALADIN",
    pendingClass: null,
    pendingSince: null,
  };

  it("no cambia nada si la clase dominante ya es la actual", () => {
    const result = applyClassInertia(baseState, "PALADIN", new Date());
    expect(result.classChanged).toBe(false);
    expect(result.newCurrentClass).toBe("PALADIN");
  });

  it("inicia el contador si aparece una clase dominante distinta", () => {
    const now = new Date();
    const result = applyClassInertia(baseState, "WARRIOR", now);
    expect(result.classChanged).toBe(false);
    expect(result.newPendingClass).toBe("WARRIOR");
    expect(result.newPendingSince).toEqual(now);
  });

  it("NO cambia de clase antes de cumplirse el umbral de 21 días", () => {
    const pendingSince = new Date();
    const state: ClassInertiaState = {
      currentClass: "PALADIN",
      pendingClass: "WARRIOR",
      pendingSince,
    };
    const tenDaysLater = new Date(pendingSince.getTime() + 10 * 24 * 60 * 60 * 1000);
    const result = applyClassInertia(state, "WARRIOR", tenDaysLater);
    expect(result.classChanged).toBe(false);
    expect(result.newCurrentClass).toBe("PALADIN");
  });

  it("SÍ cambia de clase al cumplirse el umbral de 21 días", () => {
    const pendingSince = new Date();
    const state: ClassInertiaState = {
      currentClass: "PALADIN",
      pendingClass: "WARRIOR",
      pendingSince,
    };
    const twentyOneDaysLater = new Date(pendingSince.getTime() + 21 * 24 * 60 * 60 * 1000);
    const result = applyClassInertia(state, "WARRIOR", twentyOneDaysLater);
    expect(result.classChanged).toBe(true);
    expect(result.newCurrentClass).toBe("WARRIOR");
    expect(result.newPendingClass).toBeNull();
  });
});

describe("calculateWeaponXpFromKills", () => {
  it("da XP proporcional a las muertes", () => {
    expect(calculateWeaponXpFromKills(5)).toBe(50);
    expect(calculateWeaponXpFromKills(0)).toBe(0);
  });
});

describe("calculateWeaponLevel", () => {
  it("empieza en nivel 1 con 0 XP", () => {
    expect(calculateWeaponLevel(0)).toBe(1);
  });
});

describe("calculateWeaponDamage", () => {
  it("el daño sube con el nivel del arma", () => {
    expect(calculateWeaponDamage(10, 1)).toBe(10);
    expect(calculateWeaponDamage(10, 3)).toBe(14);
  });
});

describe("calculateStreakDays", () => {
  it("da 0 si no hay sesiones", () => {
    expect(calculateStreakDays([], new Date("2026-01-10"))).toBe(0);
  });

  it("cuenta días consecutivos hasta hoy", () => {
    const today = new Date("2026-01-10");
    const dates = [
      new Date("2026-01-10"),
      new Date("2026-01-09"),
      new Date("2026-01-08"),
    ];
    expect(calculateStreakDays(dates, today)).toBe(3);
  });

  it("corta la racha si hay un día sin sesión", () => {
    const today = new Date("2026-01-10");
    const dates = [new Date("2026-01-10"), new Date("2026-01-08")];
    expect(calculateStreakDays(dates, today)).toBe(1);
  });
});

describe("calculateVitalityXpGain", () => {
  it("da el XP base sin racha", () => {
    expect(calculateVitalityXpGain(0)).toBe(5);
  });

  it("sube con la racha, pero no supera el tope", () => {
    expect(calculateVitalityXpGain(10)).toBe(10);
    expect(calculateVitalityXpGain(100)).toBe(20);
  });
});

describe("calculateVitalityDecay", () => {
  it("no decae dentro del margen de gracia", () => {
    expect(calculateVitalityDecay(2)).toBe(0);
    expect(calculateVitalityDecay(3)).toBe(0);
  });

  it("decae proporcionalmente tras superar el margen", () => {
    expect(calculateVitalityDecay(4)).toBe(5);
    expect(calculateVitalityDecay(6)).toBe(15);
  });
});