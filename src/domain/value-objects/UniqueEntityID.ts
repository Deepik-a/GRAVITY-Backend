//* what is value objects

//?An object that represents a small concept/value in your domain, defined by its properties, not by an ID,
//? and which encapsulates validation and behavior.

//* Benefits of using Email instead of string(Email as value-objects)
// ! built-in validation can be given
//! Encapsulation
//! Type Safety


//example of encapsulation and partial abstraction
// 1️⃣ Encapsulation

// Encapsulation = hiding internal data and exposing only controlled methods.

// value is private → you cannot directly change or access it.

// Only two public methods (toString() and toObjectId()) expose the ID safely.

// Internal details (like ObjectId creation logic) are hidden from the outside world.

// ✅ So yes — encapsulation is used here.
// 2️⃣ Abstraction

// Abstraction means defining high-level behavior while hiding complex details.
// This class has a small degree of abstraction too — it abstracts away how an ID is represented (string vs ObjectId),
// but primarily it’s an example of encapsulation, not abstraction.

// src/domain/value-objects/UniqueEntityID.ts
import { ObjectId } from "mongodb";
export class UniqueEntityID {
  constructor(private readonly _value: string | ObjectId) {}
  toString() {
    return this._value.toString();
  }
  toObjectId(): ObjectId {
    return typeof this._value === "string" ? new ObjectId(this._value) : this._value;
  }
  toJSON() {
    return this.toString();
  }
}
