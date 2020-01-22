import { ZHL16, createZHL16BTissues } from './ZHL16';
import { Utils } from "./Utils";

describe('ZHL16B', () => {

  test('::ceilingLimit', () => {
    let prevPoint: [number | null, object] = [null, {}];
    const points: Array<[number, number[]]> = [
      [0.7406544600000000, [0, 0, 0.68, 0]],
      [0.9199082579147086, [30, 90, 0.68, 0]],
      [2.5724610911196693, [30, 1200, 0.68, 0]],
      [2.4264377498030796, [10, 120, 0.68, 0]],
    ];
    const utils = new Utils(1022);
    const algorithm = new ZHL16(createZHL16BTissues(), 1, utils);
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
          [ZHL16.gfName]: 0.3,
        },
      );
      const comp = newAttrs[ZHL16.compartmentsName][1];
      expect(comp.pN2).toBe(pressure);
      expect(comp.pHe).toBe(0);
      prevPoint = [nextDepth, newAttrs];
    });
  });

});
