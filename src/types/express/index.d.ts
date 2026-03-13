import "express";
import "passport";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      role: string;
    }
  }

  namespace Passport {
    interface User {
      id: string;
      email: string;
      name: string;
      role: string;
    }
  }
}
