package com.wandernav.wander_backend.controllers;

import com.wandernav.wander_backend.models.Message;
import com.wandernav.wander_backend.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    @Autowired
    private MessageRepository messageRepository;

    // Send a message (direct or group)
    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {
        message.setTimestamp(new Date());
        Message saved = messageRepository.save(message);
        return ResponseEntity.ok(saved);
    }

    // Get direct messages for a user (where user is sender or recipient)
    @GetMapping
    public ResponseEntity<List<Message>> getMessages(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String groupId) {
        if (groupId != null) {
            // Get group messages
            return ResponseEntity.ok(messageRepository.findByGroupId(groupId));
        } else if (userId != null) {
            // Get direct messages (where user is sender or recipient)
            List<Message> sent = messageRepository.findBySenderId(userId);
            List<Message> received = messageRepository.findByRecipientIdsContaining(userId);
            sent.addAll(received);
            return ResponseEntity.ok(sent);
        } else {
            // Return all messages (not recommended for production)
            return ResponseEntity.ok(messageRepository.findAll());
        }
    }
} 