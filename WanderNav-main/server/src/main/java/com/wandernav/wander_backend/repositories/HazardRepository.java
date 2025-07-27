package com.wandernav.wander_backend.repositories;

import com.wandernav.wander_backend.models.Hazard;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HazardRepository extends MongoRepository<Hazard, String> {
} 