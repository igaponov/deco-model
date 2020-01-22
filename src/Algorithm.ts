export interface Algorithm {
  ceilingLimit(
    prevDepth: number | null,
    nextDepth: number,
    time: number,
    n2Fraction: number,
    heFraction: number,
    attrs: { [property: string]: any},
  ): [number, object];
}
