const CLASSIFICATIONS = [
  { max: 18.5, label: "Abaixo do peso" },
  { max: 25, label: "Peso normal" },
  { max: 30, label: "Sobrepeso" },
  { max: 35, label: "Obesidade grau I" },
  { max: 40, label: "Obesidade grau II" },
  { max: Infinity, label: "Obesidade grau III" },
];

function calculate(height, weight) {
  return Math.round((weight / (height * height)) * 100) / 100;
}

function classify(bmiValue) {
  return CLASSIFICATIONS.find(({ max }) => bmiValue < max).label;
}

const bmi = {
  calculate,
  classify,
};

export default bmi;
