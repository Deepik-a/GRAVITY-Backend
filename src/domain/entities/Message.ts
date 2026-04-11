import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";

export interface MessageProps {
  id?: UniqueEntityID;
  conversationId: string;
  senderId: string;
  senderType: "user" | "company";
  content: string;
  attachmentUrl?: string;
  attachmentKey?: string;
  attachmentType?: "image" | "file";
  createdAt?: Date;
  status?: "sent" | "delivered" | "read";
}

export class Message {
  public readonly id: UniqueEntityID;
  public readonly conversationId: string;
  public readonly senderId: string;
  public readonly senderType: "user" | "company";
  public readonly content: string;
  public readonly attachmentUrl?: string;
  public readonly attachmentKey?: string;
  public readonly attachmentType?: "image" | "file";
  public readonly createdAt: Date;
  public readonly status: "sent" | "delivered" | "read";

  constructor(props: MessageProps) {
    this.id = props.id || new UniqueEntityID(new Date().getTime().toString());
    this.conversationId = props.conversationId;
    this.senderId = props.senderId;
    this.senderType = props.senderType;
    this.content = props.content;
    this.attachmentUrl = props.attachmentUrl;
    this.attachmentKey = props.attachmentKey;
    this.attachmentType = props.attachmentType;
    this.createdAt = props.createdAt || new Date();
    this.status = props.status || "sent";
  }
}
