using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Extenions;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace API.Hubs
{
    [Authorize]
    public class Chat(UserManager<AppUser> userManager, AppDbContext context) : Hub
    {
        public static readonly ConcurrentDictionary<string, OnlineUserDto> onlineUsers = new();

        public override async Task OnConnectedAsync()
        {
            var receiverId = Context.GetHttpContext()?.Request.Query["receiverId"].ToString();
            var userName = Context.User?.Identity?.Name;

            if (string.IsNullOrEmpty(userName))
                throw new ArgumentNullException(nameof(userName), "User name cannot be null or empty.");

            var currentUser = await userManager.FindByNameAsync(userName);
            var connectionId = Context.ConnectionId;

            if (onlineUsers.ContainsKey(currentUser!.Id))
            {
                onlineUsers[currentUser.Id].ConnectionId = connectionId;
            }
            else
            {
                var user = new OnlineUserDto
                {
                    ConnectionId = connectionId,
                    UserName = currentUser.UserName,
                    ProfileIamge = currentUser.ProfileIamge,
                    FullName = currentUser.FullName,
                    Email = currentUser.Email,
                    IsOnline = true,
                    UnreadMessagesCount = context.Messages.Count(x => x.ReceiverId == currentUser.Id && !x.IsRead),
                    Id = currentUser.Id
                };
                onlineUsers.TryAdd(currentUser.Id, user);
                await Clients.AllExcept(connectionId).SendAsync("Notify", currentUser);
            }

            if (!string.IsNullOrEmpty(receiverId))
            {
                await LoadMessages(receiverId);
            }

            await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
        }

        public async Task LoadMessages(string receiverId)
        {
            int pageNumber = 1;
            int pageSize = 10;
            var senderName = Context.User?.Identity?.Name;
            var currentUser = await userManager.FindByNameAsync(senderName!);
            if (currentUser == null)
                return;
            var messages = await context.Messages
                .Where(x => (x.SenderId == receiverId && x.ReceiverId == currentUser.Id) ||
                            (x.SenderId == currentUser.Id && x.ReceiverId == receiverId))
                .OrderByDescending(x => x.CreatedDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .OrderBy(x => x.CreatedDate)
                .Select(x => new MessageResponseDto
                {
                    Id = x.Id,
                    SenderId = x.SenderId,
                    ReceiverId = x.ReceiverId,
                    Content = x.Content,
                    CreatedAt = x.CreatedDate
                })
                .ToListAsync();

            var unreadMessages = await context.Messages
                .Where(x => x.ReceiverId == currentUser.Id &&
                            x.SenderId == receiverId &&
                            !x.IsRead)
                .ToListAsync();

            unreadMessages.ForEach(x => x.IsRead = true);


            if (unreadMessages.Count > 0)
            {
                await context.SaveChangesAsync();
                await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
            }

            if (onlineUsers.TryGetValue(currentUser.Id, out var user))
            {
                await Clients.Client(user.ConnectionId!).SendAsync("ReceieveMessageList", messages);
            }
        }

        public async Task SendMessage(MessageRequestDto messageRequestDto)
        {
            var senderName = Context.User?.Identity?.Name;
            var receiverId = messageRequestDto.ReceiverId;

            if (string.IsNullOrEmpty(senderName))
                throw new ArgumentNullException(nameof(senderName), "SenderId cannot be null.");

            var senderUser = await userManager.FindByNameAsync(senderName);
            var receiverUser = await userManager.FindByIdAsync(receiverId!);

            var message = new Message
            {
                Sender = senderUser!,
                Receiver = receiverUser!,
                Content = messageRequestDto.Content,
                CreatedDate = DateTime.UtcNow,
                IsRead = false
            };

            context.Messages.Add(message);
            await context.SaveChangesAsync();

            var response = new MessageResponseDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                ReceiverId = message.ReceiverId,
                Content = message.Content,
                CreatedAt = message.CreatedDate
            };

            if (onlineUsers.TryGetValue(receiverId!, out var receiver))
            {
                await Clients.Client(receiver.ConnectionId!).SendAsync("ReceiveMessage", response);
            }
        }

        public async Task NotifyTyping(string recipientUserId)
        {
            var senderUserName = Context.User?.Identity?.Name;
            if (senderUserName is null)
                return;

            if (onlineUsers.TryGetValue(recipientUserId, out var recipient))
            {
                await Clients.Client(recipient.ConnectionId!).SendAsync("NotifyTyping", senderUserName);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userName = Context.User?.Identity?.Name;
            var user = await userManager.FindByNameAsync(userName!);
            if (user != null)
                onlineUsers.TryRemove(user.Id, out _);

            await Clients.All.SendAsync("OnlineUsers", await GetAllUsers());
        }
        public async Task GetUserDetails(string userId)
        {
            var user = await userManager.FindByIdAsync(userId);
            if (user == null)
            {
                await Clients.Caller.SendAsync("UserNotFound");
                return;
            }
            var response = new OnlineUserDto
            {
                UserName = user.UserName,
                FullName = user.FullName,
                ProfileIamge = user.ProfileIamge,
                Email = user.Email,
                IsOnline = onlineUsers.ContainsKey(user.Id),
                UnreadMessagesCount = context.Messages.Count(x => x.ReceiverId == user.Id && !x.IsRead)
            };
            await Clients.Caller.SendAsync("ReceiveUserDetails", response);
        }
        private async Task<IEnumerable<OnlineUserDto>> GetAllUsers()
        {
            var userName = Context.User!.GetUserName();
            var currentUser = await userManager.FindByNameAsync(userName);
            var onlineUsersSet = new HashSet<string>(onlineUsers.Keys);
            var unreadCounts = await context.Messages!
                .Where(m => m.ReceiverId == currentUser!.Id && !m.IsRead)
                .GroupBy(m => m.SenderId!)
                .Select(g => new { SenderId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.SenderId, g => g.Count);
            var allUsers = await userManager.Users
                .Select(u => new OnlineUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    FullName = u.FullName,
                    ProfileIamge = u.ProfileIamge,
                    IsOnline = onlineUsersSet.Contains(u.Id),
                    UnreadMessagesCount = 0 
                })
                .ToListAsync();
            foreach (var user in allUsers)
            {
                if (unreadCounts.TryGetValue(user.Id!, out var count))
                {
                    user.UnreadMessagesCount = count;
                }
            }

            return allUsers.OrderByDescending(u => u.IsOnline);
        }
    }
}
