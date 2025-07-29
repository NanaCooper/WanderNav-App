package com.wandernav.wander_backend.repositories;

import com.wandernav.wander_backend.models.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    // Search users by username (case-insensitive, partial match)
    List<User> findByUsernameIgnoreCaseContaining(String query);
    // Search users by username or email (case-insensitive, partial match)
    List<User> findByUsernameIgnoreCaseContainingOrEmailIgnoreCaseContaining(String usernameQuery, String emailQuery);
}
