package com.github.dawid_stolarczyk.magazyn.Services.User;

import com.github.dawid_stolarczyk.magazyn.Model.Entity.User;
import com.github.dawid_stolarczyk.magazyn.Model.Entity.Warehouse;
import com.github.dawid_stolarczyk.magazyn.Model.Enums.UserTeam;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.UserRepository;
import com.github.dawid_stolarczyk.magazyn.Repositories.JPA.WarehouseRepository;
import com.github.dawid_stolarczyk.magazyn.Services.Ratelimiter.Bucket4jRateLimiter;
import com.github.dawid_stolarczyk.magazyn.Utils.InternetUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private WarehouseRepository warehouseRepository;
    @Mock
    private Bucket4jRateLimiter rateLimiter;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private UserService userService;

    private MockedStatic<InternetUtils> mockedInternetUtils;
    private User sampleUser;
    private Warehouse sampleWarehouse;

    @BeforeEach
    void setUp() {
        mockedInternetUtils = mockStatic(InternetUtils.class);
        mockedInternetUtils.when(() -> InternetUtils.getClientIp(any())).thenReturn("127.0.0.1");

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setEmail("test@test.com");
        sampleUser.setFullName("John Doe");

        sampleWarehouse = new Warehouse();
        sampleWarehouse.setId(10L);
        sampleWarehouse.setName("Central WH");

        sampleUser.setPhone("+48555019203");
        sampleUser.setLocation("Gdańsk");
        sampleUser.setTeam(UserTeam.OPERATIONS);
        sampleUser.setAssignedWarehouses(new HashSet<>(Set.of(sampleWarehouse)));
        sampleUser.setBackupCodes(new ArrayList<>());
    }

    @AfterEach
    void tearDown() {
        mockedInternetUtils.close();
    }

    @Test
    @DisplayName("should_AssignUserToWarehouse_When_Valid")
    void should_AssignUserToWarehouse_When_Valid() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(warehouseRepository.findById(10L)).thenReturn(Optional.of(sampleWarehouse));

        // When
        userService.assignUserToWarehouse(1L, 10L, request);

        // Then
        assertThat(sampleUser.getAssignedWarehouses()).contains(sampleWarehouse);
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("should_RemoveUserFromWarehouse_When_Assigned")
    void should_RemoveUserFromWarehouse_When_Assigned() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(warehouseRepository.findById(10L)).thenReturn(Optional.of(sampleWarehouse));

        // When
        userService.removeUserFromWarehouse(1L, 10L, request);

        // Then
        assertThat(sampleUser.getAssignedWarehouses()).doesNotContain(sampleWarehouse);
        verify(userRepository).save(sampleUser);
    }
}
