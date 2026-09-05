// Email is provider-agnostic for the same reason payments/storage are: swap
// in a real sender (Resend, SES, Postmark...) later without touching any
// caller. Only a console-logging dev implementation exists today.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailProvider {
  name: string;
  send(message: EmailMessage): Promise<void>;
}

class ConsoleEmailProvider implements EmailProvider {
  name = "console";
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:${this.name}] to=${message.to} subject="${message.subject}"\n${message.text}`);
  }
}

export const emailProvider: EmailProvider = new ConsoleEmailProvider();
