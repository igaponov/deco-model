export class Utils {
    private static GRAVITY_ACCELERATION = 9.81;
    private static PA_TO_BAR = 100000;

    private readonly waterCoefficient: number;

    constructor(waterDensity: number) {
        this.waterCoefficient = waterDensity * Utils.GRAVITY_ACCELERATION / Utils.PA_TO_BAR;
    }

    /**
     * p = ρ * g * h
     * where
     * p = pressure in liquid, Pa
     * ρ = density of liquid, kg/m3
     * g = acceleration of gravity, 9.81 m/s2
     * h = height of fluid column - or depth in the fluid where pressure is measured, m
     *
     * @param {number} pressure
     * @returns {number}
     */
    pressureToDepth(pressure: number): number {
        return pressure / this.waterCoefficient;
    }

    /**
     * h = p / (ρ * g)
     * where
     * p = pressure in liquid, Pa
     * ρ = density of liquid, kg/m3
     * g = acceleration of gravity, 9.81 m/s2
     * h = height of fluid column - or depth in the fluid where pressure is measured, m
     *
     * @param {number} depth
     * @returns {number}
     */
    depthToPressure(depth: number): number {
        return depth * this.waterCoefficient;
    }
}