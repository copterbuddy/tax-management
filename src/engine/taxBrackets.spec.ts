import { calculateThaiTax, marginalRate, THAI_BRACKETS } from './taxBrackets';

describe('calculateThaiTax — bracket boundaries', () => {
  const cases: Array<[number, number]> = [
    [0, 0],
    [150_000, 0],
    [300_000, 7_500],
    [500_000, 27_500],
    [750_000, 65_000],
    [1_000_000, 115_000],
    [2_000_000, 365_000],
    [5_000_000, 1_265_000],
    [6_000_000, 1_615_000],
  ];

  it.each(cases)('income %i → tax %f', (income, expected) => {
    expect(calculateThaiTax(income)).toBeCloseTo(expected, 2);
  });

  it('never charges a negative income', () => {
    expect(calculateThaiTax(-1)).toBe(0);
  });

  it('keeps the table ordered and open-ended', () => {
    expect(THAI_BRACKETS).toHaveLength(8);
    expect(THAI_BRACKETS[THAI_BRACKETS.length - 1].threshold).toBe(Infinity);
  });
});

describe('marginalRate', () => {
  it.each([[0, 0], [150_000, 0], [200_000, 0.05], [400_000, 0.1], [900_000, 0.2], [3_000_000, 0.3], [9_000_000, 0.35]])(
    'income %i → %f',
    (income, expected) => {
      expect(marginalRate(income)).toBeCloseTo(expected, 4);
    },
  );
});
