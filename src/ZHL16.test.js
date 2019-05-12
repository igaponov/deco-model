import { ZHL16, compartmentsName, gfName, createZHL16BTissues } from './ZHL16';

describe('ZHL16B', () => {

  test('::ceilingLimit', () => {
    let prevPoint: [?number, Object] = [null, {}];
    const points = [
      [0.7406544600000000, [0, 0, 0.68, 0, {}]],
      [0.9199082579147086, [30, 90, 0.68, 0, {}]],
      [2.5724610911196693, [30, 1200, 0.68, 0, {}]],
      [2.4264377498030796, [10, 120, 0.68, 0, {}]],
    ];
    const algorithm = new ZHL16(createZHL16BTissues(), 1, 1022);
    points.forEach(([pressure, point]) => {
      const [prevDepth, attrs] = prevPoint;
      const [nextDepth, time, n2Fraction, heFraction] = point;
      const [, newAttrs] = algorithm.ceilingLimit(
        prevDepth,
        nextDepth,
        time,
        n2Fraction,
        heFraction,
        {
          ...attrs,
          [gfName]: 0.3,
        },
      );
      const comp = newAttrs[compartmentsName][1];
      expect(comp.pN2).toBe(pressure);
      expect(comp.pHe).toBe(0);
      prevPoint = [nextDepth, newAttrs];
    });
  });

});
