

export class ProfileResponseDTO {
  constructor(
    public userId: string,
    public name: string,
    public email: string,
    public profileImage?: string,
    public phone?: string,
    public location?: string,
    public bio?: string,
    public isBlocked?: boolean
  ) {}
}
