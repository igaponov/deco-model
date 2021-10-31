import {WATER_VAPOUR_PRESSURE} from "./constants";

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

    /**
     * Palv - Pressure of inspired inert gas
     * @param {number} fGas Inert gas fraction, i.e. 0.79 for air
     * @param {number} pAbs Absolute pressure of current depth [bar]
     * @returns {number}
     */
    static pressureInspired(fGas: number, pAbs: number): number {
        return fGas * (pAbs - WATER_VAPOUR_PRESSURE);
    }

    /**
     * R - Rate of change of inert gas pressure
     * @param {number} fGas Inert gas fraction, i.e. 0.79 for air
     * @param {number} Prate Pressure rate change [bar/min] (for example, about 1 bar/min is 10m/min)
     * @returns {number}
     */
    static gasRate(fGas: number, Prate: number): number {
        return fGas * Prate;
    }

    /**
     * Function for ascent and descent gas loading calculations
     *
     * @param {number} pAlv Pressure of inspired inert gas
     * @param {number} rate Rate of change of inert gas pressure
     * @param {number} time Time of exposure in minutes.
     * @param {number} k Gas decay constant for a tissue compartment
     * @param {number} Pi Initial inert gas pressure in a tissue compartment.
     * @return {number}
     * */
    static schreinerEquation(pAlv: number, rate: number, time: number, k: number, Pi: number): number {
        return pAlv + rate * (time / 60 - 1 / k) - (pAlv - Pi - rate / k) * Math.exp(-k * time / 60);
    }

    /**
     * Function for gas loading calculations at a constant depth
     * @param {number} Pi
     * @param {number} pAlv
     * @param {number} k
     * @param {number} time
     * @returns {number}
     */
    static haldaneEquation(Pi: number, pAlv: number, k: number, time: number): number {
        return Pi + (pAlv - Pi) * (1 - Math.exp(-k * time / 60));
    }
}