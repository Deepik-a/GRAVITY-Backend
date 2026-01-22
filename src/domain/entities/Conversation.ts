import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";

export interface ConversationProps {
  id?: UniqueEntityID;
  participants: {
    participantId: string;
    participantType: "user" | "company";
  }[];
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: number;
  otherParticipantName?: string;
  otherParticipantImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Conversation {
  public readonly id: UniqueEntityID;
  public readonly participants: {
    participantId: string;
    participantType: "user" | "company";
  }[];
  public readonly lastMessage?: string;
  public readonly lastMessageAt?: Date;
  public readonly unreadCount: number;
  public readonly otherParticipantName?: string;
  public readonly otherParticipantImage?: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: ConversationProps) {
    this.id = props.id || new UniqueEntityID(new Date().getTime().toString());
    this.participants = props.participants;
    this.lastMessage = props.lastMessage;
    this.lastMessageAt = props.lastMessageAt;
    this.unreadCount = props.unreadCount || 0;
    this.otherParticipantName = props.otherParticipantName;
    this.otherParticipantImage = props.otherParticipantImage;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }
}
