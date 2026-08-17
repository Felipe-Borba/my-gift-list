import bmi from "models/bmi.js";

describe("bmi model", () => {
  describe("calculate()", () => {
    test("Computes weight / height² rounded to 2 decimals", () => {
      expect(bmi.calculate(1.7, 80)).toBe(27.68);
      expect(bmi.calculate(1.8, 74.9)).toBe(23.12);
      expect(bmi.calculate(2, 74)).toBe(18.5);
    });
  });

  describe("classify()", () => {
    test("Below 18.5 is 'Abaixo do peso'", () => {
      expect(bmi.classify(10)).toBe("Abaixo do peso");
      expect(bmi.classify(18.49)).toBe("Abaixo do peso");
    });

    test("From 18.5 to below 25 is 'Peso normal'", () => {
      expect(bmi.classify(18.5)).toBe("Peso normal");
      expect(bmi.classify(24.9)).toBe("Peso normal");
      expect(bmi.classify(24.99)).toBe("Peso normal");
    });

    test("From 25 to below 30 is 'Sobrepeso'", () => {
      expect(bmi.classify(25)).toBe("Sobrepeso");
      expect(bmi.classify(29.99)).toBe("Sobrepeso");
    });

    test("From 30 to below 35 is 'Obesidade grau I'", () => {
      expect(bmi.classify(30)).toBe("Obesidade grau I");
      expect(bmi.classify(34.99)).toBe("Obesidade grau I");
    });

    test("From 35 to below 40 is 'Obesidade grau II'", () => {
      expect(bmi.classify(35)).toBe("Obesidade grau II");
      expect(bmi.classify(39.99)).toBe("Obesidade grau II");
    });

    test("40 or above is 'Obesidade grau III'", () => {
      expect(bmi.classify(40)).toBe("Obesidade grau III");
      expect(bmi.classify(75)).toBe("Obesidade grau III");
    });
  });
});
