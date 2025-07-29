package com.wandernav.wander_backend.controllers;

import com.wandernav.wander_backend.models.Destination;
import com.wandernav.wander_backend.repositories.DestinationRepository;
import com.wandernav.wander_backend.models.User;
import com.wandernav.wander_backend.repositories.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/destinations")
@Tag(name = "Destinations", description = "Manage saved destinations")
public class DestinationController {

    @Autowired
    private DestinationRepository destinationRepository;

    @Autowired
    private UserRepository userRepository;

    @Operation(summary = "Get all destinations for the current user")
    @GetMapping
    public ResponseEntity<List<Destination>> getDestinations() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }

            User user = userOpt.get();
            List<Destination> destinations = destinationRepository.findByUserId(String.valueOf(user.getId()));
            return ResponseEntity.ok(destinations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }

    @Operation(summary = "Create a new destination")
    @PostMapping
    public ResponseEntity<?> createDestination(@RequestBody Destination destination) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            User user = userOpt.get();
            destination.setUserId(String.valueOf(user.getId()));
            destination.setCreatedAt(new Date());
            destination.setUpdatedAt(new Date());
            
            Destination savedDestination = destinationRepository.save(destination);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedDestination);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create destination");
        }
    }

    @Operation(summary = "Update a destination")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateDestination(@PathVariable String id, @RequestBody Destination updatedDestination) {
        try {
            Optional<Destination> destinationOpt = destinationRepository.findById(id);
            if (destinationOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Destination not found");
            }

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            Destination destination = destinationOpt.get();
            User user = userOpt.get();

            if (!destination.getUserId().equals(String.valueOf(user.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            destination.setName(updatedDestination.getName());
            destination.setAddress(updatedDestination.getAddress());
            destination.setLatitude(updatedDestination.getLatitude());
            destination.setLongitude(updatedDestination.getLongitude());
            destination.setCategory(updatedDestination.getCategory());
            destination.setIsFavorite(updatedDestination.getIsFavorite());
            destination.setUpdatedAt(new Date());

            Destination savedDestination = destinationRepository.save(destination);
            return ResponseEntity.ok(savedDestination);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update destination");
        }
    }

    @Operation(summary = "Delete a destination")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDestination(@PathVariable String id) {
        try {
            Optional<Destination> destinationOpt = destinationRepository.findById(id);
            if (destinationOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Destination not found");
            }

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            Destination destination = destinationOpt.get();
            User user = userOpt.get();

            if (!destination.getUserId().equals(String.valueOf(user.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            destinationRepository.delete(destination);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete destination");
        }
    }

    @Operation(summary = "Toggle favorite status of a destination")
    @PatchMapping("/{id}/favorite")
    public ResponseEntity<?> toggleFavorite(@PathVariable String id) {
        try {
            Optional<Destination> destinationOpt = destinationRepository.findById(id);
            if (destinationOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Destination not found");
            }

            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }

            Destination destination = destinationOpt.get();
            User user = userOpt.get();

            if (!destination.getUserId().equals(String.valueOf(user.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied");
            }

            destination.setIsFavorite(!destination.getIsFavorite());
            destination.setUpdatedAt(new Date());

            Destination savedDestination = destinationRepository.save(destination);
            return ResponseEntity.ok(savedDestination);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to toggle favorite");
        }
    }

    @Operation(summary = "Get destinations by category")
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Destination>> getDestinationsByCategory(@PathVariable String category) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }

            User user = userOpt.get();
            List<Destination> destinations = destinationRepository.findByUserIdAndCategory(String.valueOf(user.getId()), category);
            return ResponseEntity.ok(destinations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }

    @Operation(summary = "Get favorite destinations")
    @GetMapping("/favorites")
    public ResponseEntity<List<Destination>> getFavoriteDestinations() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            Optional<User> userOpt = userRepository.findByUsername(username);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ArrayList<>());
            }

            User user = userOpt.get();
            List<Destination> destinations = destinationRepository.findByUserIdAndIsFavoriteTrue(String.valueOf(user.getId()));
            return ResponseEntity.ok(destinations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ArrayList<>());
        }
    }
} 