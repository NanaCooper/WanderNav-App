package com.wandernav.wander_backend.repositories;

import com.wandernav.wander_backend.models.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
 
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByRecipientIdsContaining(String userId);
    List<Message> findBySenderId(String senderId);
    List<Message> findByGroupId(String groupId);
} 