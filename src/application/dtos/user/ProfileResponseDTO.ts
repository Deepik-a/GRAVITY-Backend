

export class ProfileResponseDTO {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public profileImage?: string,
    public phone?: string,
    public location?: string,
    public bio?: string,
    public isBlocked?: boolean,
    public role?: string
  ) {}
}
