import type { StyleComponent } from "../index";
import Tacos from "./tacos";
import Coffee from "./coffee";
import Seafood from "./seafood";
import Pizza from "./pizza";
import Chicken from "./chicken";
import Gyros from "./gyros";
import Bbq from "./bbq";
import Burgers from "./burgers";
import IceCream from "./icecream";
import Sushi from "./sushi";
import Bagels from "./bagels";
import Ramen from "./ramen";
import Crepes from "./crepes";
import Donuts from "./donuts";
import Pretzels from "./pretzels";
import Vegan from "./vegan";
import Poke from "./poke";
import Churros from "./churros";
import Boba from "./boba";
import GrilledCheese from "./grilledcheese";

/**
 * The Mom-n-Pops collection's style-mounting registry — one fictional
 * Milwaukee family food truck (Rosa & Sal, est. 2026) designed twenty ways,
 * one per cuisine, keyed by style id from App\Support\GalleryRegistry.
 * Same rules as the fieldwork registry: STATIC imports (Inertia SSR), each
 * page self-contained with its co-located ./{id}.css.
 */
export const MOM_N_POPS_STYLES: Record<string, StyleComponent> = {
    tacos: Tacos,
    coffee: Coffee,
    seafood: Seafood,
    pizza: Pizza,
    chicken: Chicken,
    gyros: Gyros,
    bbq: Bbq,
    burgers: Burgers,
    icecream: IceCream,
    sushi: Sushi,
    bagels: Bagels,
    ramen: Ramen,
    crepes: Crepes,
    donuts: Donuts,
    pretzels: Pretzels,
    vegan: Vegan,
    poke: Poke,
    churros: Churros,
    boba: Boba,
    grilledcheese: GrilledCheese,
};
