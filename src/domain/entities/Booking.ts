//* What is entities

// ? Hosts classes representing core business logic
//?the entity is what your domain logic trusts — the DTO is just input(the DTO  might be invalid or unsafe.)

//! private  _name------>The underscore _ is a naming convention showing “private” fields.
//! private → cannot be accessed directly outside the class.(encapsulation)
//!static means: you call it on the class itself, not on an instance


//**static method */
//class User {
//   static greet() {
//     console.log("Hello from the class!")
//   }
// }

// // ✅ called on the class
// User.greet()

// // ❌ called on an instance (won’t work)
// const user = new User()
// user.greet() // Error
