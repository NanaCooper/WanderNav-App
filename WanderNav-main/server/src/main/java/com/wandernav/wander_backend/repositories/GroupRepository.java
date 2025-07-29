package com.wandernav.wander_backend.repositories;

import com.wandernav.wander_backend.models.Group;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
 
public interface GroupRepository extends MongoRepository<Group, String> {
    List<Group> findByMemberIdsContaining(String userId);
} 