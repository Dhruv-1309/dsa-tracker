package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.FriendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/friends", "/api/friends"})
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @PostMapping("/requests")
    public ResponseEntity<FriendRequestActionResponse> sendFriendRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody FriendRequestInput request
    ) {
        UUID callerId = getAuthenticatedUserId(userDetails);
        return ResponseEntity.ok(friendService.sendFriendRequest(callerId, request.getCode()));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<IncomingFriendRequestResponse>> getIncomingPendingRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID callerId = getAuthenticatedUserId(userDetails);
        return ResponseEntity.ok(friendService.getIncomingPendingRequests(callerId));
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<FriendRequestActionResponse> acceptFriendRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id
    ) {
        UUID callerId = getAuthenticatedUserId(userDetails);
        return ResponseEntity.ok(friendService.acceptFriendRequest(callerId, id));
    }

    @PostMapping("/requests/{id}/decline")
    public ResponseEntity<Void> declineFriendRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id
    ) {
        UUID callerId = getAuthenticatedUserId(userDetails);
        friendService.declineFriendRequest(callerId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<FriendResponse>> getAcceptedFriends(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UUID callerId = getAuthenticatedUserId(userDetails);
        return ResponseEntity.ok(friendService.getAcceptedFriends(callerId));
    }

    @DeleteMapping("/{friendUserId}")
    public ResponseEntity<Void> removeFriend(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID friendUserId
    ) {
        UUID callerId = getAuthenticatedUserId(userDetails);
        friendService.removeFriend(callerId, friendUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{friendUserId}/summary")
    public ResponseEntity<FriendSummaryResponse> getFriendSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID friendUserId,
            @RequestParam(required = false) Integer year
    ) {
        UUID callerId = getAuthenticatedUserId(userDetails);
        return ResponseEntity.ok(friendService.getFriendSummary(callerId, friendUserId, year));
    }

    private UUID getAuthenticatedUserId(CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthenticated");
        }
        return UUID.fromString(userDetails.getId());
    }
}
