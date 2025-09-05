import * as SendGrid from "@sendgrid/mail";

SendGrid.setApiKey(process.env.SENDGRID_API_KEY as string);

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

export const sendOrderConfirmation = async (
  to: string,
  items: OrderItem[],
  total: number
) => {
  const itemList = items
    .map(
      (item) =>
        `${item.quantity} x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
    )
    .join("\n");

  const message = {
    to,
    from: "your_verified_sender@example.com", // Replace with your verified sender
    subject: "Your Rivals TCG Order Confirmation",
    text: `Thank you for your purchase!\n\nYour Order:\n${itemList}\n\nTotal: $${total.toFixed(2)}\n\nWe appreciate your business.`,
  };

  try {
    await SendGrid.send(message);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};
