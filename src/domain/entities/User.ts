

export interface UserSignUpDetails{
    name:string,
    email:string,
    phone:string,
    password:string;
}

export class UserSignUp implements UserSignUpDetails{
constructor(
    public name:string,
    public email:string,
    public phone:string,
    public password: string
)
{}
}

