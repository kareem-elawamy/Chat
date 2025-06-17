using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace API.Hubs
{
    public class Vide : Hub
    {
        public async Task SendOffer(string receiverId, string offer)
        {

            if (string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(offer))
            {
                throw new ArgumentException("Receiver ID and offer cannot be null or empty.");
            }
            Console.WriteLine($"Sending offer to {receiverId}: {offer}");
            Console.WriteLine($"[SendOffer] To: {receiverId}, From: {Context.UserIdentifier}");
            await Clients.User(receiverId).SendAsync("ReceiveOffer", Context.UserIdentifier, offer);
        }
        public async Task SendAnswer(string receiverId, string answer)
        {
            if (string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(answer))
            {
                throw new ArgumentException("Receiver ID and answer cannot be null or empty.");
            }
            Console.WriteLine($"Sending answer to {receiverId}: {answer}");
            Console.WriteLine($"[SendAnswer] To: {receiverId}, From: {Context.UserIdentifier}");
            await Clients.User(receiverId).SendAsync("ReceiveAnswer", Context.UserIdentifier, answer);

        }
        public async Task SendIceCandidate(string receiverId, string candidate)
        {
            if (string.IsNullOrEmpty(receiverId) || string.IsNullOrEmpty(candidate))
            {
                throw new ArgumentException("Receiver ID and candidate cannot be null or empty.");
            }

            await Clients.User(receiverId).SendAsync("ReceiveIceCandidate", Context.UserIdentifier, candidate);
        }
            public async Task EndCall(string receiverId)
        {
            if (string.IsNullOrEmpty(receiverId))
            {
                throw new ArgumentException("Receiver ID cannot be null or empty.");
            }

            await Clients.User(receiverId).SendAsync("CallEnded");
        }

    }
}