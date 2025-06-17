export interface ChatMessage {
  content: string;
  receiverId: string;
  senderId?: string;
  timeSent?: Date;
  isRead?: boolean;
}
