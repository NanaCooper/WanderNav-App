package com.wandernav.wander_backend.controllers;

import com.wandernav.wander_backend.models.Hazard;
import com.wandernav.wander_backend.repositories.HazardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/hazards")
public class HazardController {
    @Autowired
    private HazardRepository hazardRepository;

    @PostMapping
    public ResponseEntity<?> submitHazard(@RequestBody Map<String, Object> payload) {
        try {
            String category = (String) payload.get("category");
            String description = (String) payload.get("description");
            String photoUrl = (String) payload.getOrDefault("photoUrl", null);
            double latitude = ((Number) payload.get("latitude")).doubleValue();
            double longitude = ((Number) payload.get("longitude")).doubleValue();
            String reportedBy = (String) payload.getOrDefault("reportedBy", null);
            Date createdAt = new Date();

            Hazard hazard = new Hazard(category, description, photoUrl, latitude, longitude, createdAt, reportedBy);
            hazardRepository.save(hazard);
            return ResponseEntity.ok(hazard);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to submit hazard: " + e.getMessage());
        }
    }
} 