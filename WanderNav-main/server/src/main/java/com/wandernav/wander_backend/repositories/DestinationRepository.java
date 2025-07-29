package com.wandernav.wander_backend.repositories;

import com.wandernav.wander_backend.models.Destination;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DestinationRepository extends MongoRepository<Destination, String> {
    
    // Find all destinations for a specific user
    List<Destination> findByUserId(String userId);
    
    // Find destinations by user ID and category
    List<Destination> findByUserIdAndCategory(String userId, String category);
    
    // Find favorite destinations for a specific user
    List<Destination> findByUserIdAndIsFavoriteTrue(String userId);
    
    // Find destinations by category for a specific user
    List<Destination> findByUserIdAndCategoryAndIsFavoriteTrue(String userId, String category);
} 