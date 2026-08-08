package com.jabeproduction.stagelink.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jabeproduction.stagelink.R

// Colors - Redesigned for StageLink Branding
val PrimaryBlue = Color(0xFF0066FF)
val SecondaryBlue = Color(0xFF00CCFF)
val LightBlueBg = Color(0xFFE3F2FD)
val BackgroundGray = Color(0xFFF8FAFC)
val TextGray = Color(0xFF64748B)
val TextBlack = Color(0xFF1E293B)
val RedBadge = Color(0xFFEF4444)
val BrandGradient = Brush.verticalGradient(listOf(PrimaryBlue, SecondaryBlue))
val BrandGradientHorizontal = Brush.horizontalGradient(listOf(PrimaryBlue, SecondaryBlue))

@Composable
fun StageLinkTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColorScheme(
            primary = PrimaryBlue,
            onPrimary = Color.White,
            secondary = SecondaryBlue,
            background = BackgroundGray,
            surface = Color.White,
            onSurface = TextBlack,
            outline = Color.LightGray.copy(alpha = 0.5f),
        ),
        typography = Typography(
            bodyLarge = TextStyle(
                color = TextBlack,
                fontSize = 16.sp,
            ),
        ),
        content = content,
    )
}

@Composable
fun StageLinkIcon(
    modifier: Modifier = Modifier,
    resId: Int? = null,
    contentDescription: String? = null,
    tint: Color = LocalContentColor.current,
) {
    if (resId != null) {
        Icon(
            painter = painterResource(resId),
            contentDescription = contentDescription,
            modifier = modifier,
            tint = tint,
        )
    } else {
        Box(
            modifier = modifier
                .size(24.dp)
                .background(color = tint.copy(alpha = 0.5f), shape = CircleShape),
        )
    }
}

@Composable
fun StageLinkApp(modifier: Modifier = Modifier) {
    var currentScreen by rememberSaveable { mutableIntStateOf(3) }
    var activeCall by rememberSaveable { mutableStateOf<CallMode?>(null) }
    var selectedMessage by remember { mutableStateOf<MessageInfo?>(null) }
    
    StageLinkTheme {
        Scaffold(
            modifier = modifier,
            bottomBar = {
                if ((activeCall == null) && (currentScreen != 0)) {
                    NavigationBar(
                        containerColor = Color.White,
                        tonalElevation = 8.dp,
                    ) {
                        val items = listOf(
                            NavigationItem("Feed", R.drawable.ic_search, 1),
                            NavigationItem("Match", R.drawable.ic_heart, 2),
                            NavigationItem("Discussions", R.drawable.ic_chat, 3),
                            NavigationItem("Notifications", R.drawable.ic_add, 4), // Placeholder for Notifications
                            NavigationItem("Premium", R.drawable.logo, 5), // Placeholder icon
                        )
                        
                        items.forEach { item ->
                            NavigationBarItem(
                                selected = currentScreen == item.screenId,
                                onClick = { 
                                    currentScreen = item.screenId
                                    selectedMessage = null
                                },
                                icon = { 
                                    if (item.label == "Premium") {
                                        StageLinkLogoSmall(modifier = Modifier.size(24.dp))
                                    } else {
                                        StageLinkIcon(resId = item.iconRes, contentDescription = item.label) 
                                    }
                                },
                                label = { Text(item.label, fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = PrimaryBlue,
                                    selectedTextColor = PrimaryBlue,
                                    unselectedIconColor = TextGray,
                                    unselectedTextColor = TextGray,
                                    indicatorColor = Color.Transparent,
                                ),
                            )
                        }
                    }
                }
            },
        ) { padding ->
            Box(modifier = Modifier.padding(padding)) {
                if ((activeCall != null) && (selectedMessage != null)) {
                    CallScreen(
                        mode = activeCall!!,
                        contact = selectedMessage!!,
                    ) { activeCall = null }
                } else {
                    when (currentScreen) {
                        0 -> LoginScreen { currentScreen = 1 }
                        1 -> JobListingScreen()
                        2 -> JobSwipingScreen()
                        3 -> {
                            if (selectedMessage != null) {
                                ChatDetailScreen(
                                    message = selectedMessage!!,
                                    onBack = { selectedMessage = null },
                                    onCall = { activeCall = CallMode.AUDIO },
                                ) { activeCall = CallMode.VIDEO }
                            } else {
                                MessagesScreen { selectedMessage = it }
                            }
                        }
                        4 -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("Notifications") }
                        5 -> ProfileScreen()
                    }
                }
            }
        }
    }
}

data class NavigationItem(val label: String, val iconRes: Int, val screenId: Int)

@Composable
fun LoginScreen(modifier: Modifier = Modifier, onLogin: () -> Unit = {}) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        StageLinkLogo(modifier = Modifier.size(160.dp))
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            "Bienvenue sur\nStageLink",
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            lineHeight = 38.sp,
            color = TextBlack,
        )
        
        Text(
            "Connectez, Collaborez, Créez",
            fontSize = 16.sp,
            color = TextGray,
            modifier = Modifier.padding(top = 8.dp),
        )
        
        Spacer(modifier = Modifier.height(48.dp))
        
        OutlinedTextField(
            value = "",
            onValueChange = {},
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = Color.LightGray.copy(alpha = 0.5f),
                focusedBorderColor = PrimaryBlue,
            ),
        )
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = "",
            onValueChange = {},
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = Color.LightGray.copy(alpha = 0.5f),
                focusedBorderColor = PrimaryBlue,
            ),
        )
        Spacer(modifier = Modifier.height(32.dp))
        
        GradientButton(
            text = "Log in",
            onClick = onLogin,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        TextButton(onClick = {}) {
            Text("Sign-up", color = PrimaryBlue, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun JobListingScreen(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundGray)
            .verticalScroll(rememberScrollState()),
    ) {
        BlueHeader(
            showLogo = true,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Spacer(modifier = Modifier.width(40.dp))
                Row(
                    modifier = Modifier
                        .height(36.dp)
                        .background(Color.White.copy(alpha = 0.2f), RoundedCornerShape(18.dp))
                        .padding(horizontal = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    val tabs = listOf("Feed", "Match", "Collab")
                    var selectedTab by remember { mutableIntStateOf(0) }
                    tabs.forEachIndexed { index, title ->
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (selectedTab == index) Color.White else Color.Transparent)
                                .clickable { selectedTab = index }
                                .padding(horizontal = 16.dp, vertical = 4.dp),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                title,
                                color = if (selectedTab == index) PrimaryBlue else Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                            )
                        }
                    }
                }
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(Color.White, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("S", color = PrimaryBlue, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
        
        Column(
            modifier = Modifier
                .offset(y = (-30).dp)
                .fillMaxSize()
                .background(Color.White, RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp))
                .padding(top = 24.dp),
        ) {
            StoryListView(modifier = Modifier.padding(bottom = 16.dp))
            
            PublishBar(modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp))
            
            Text(
                "Opportunités Musicales",
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            )
            
            JobCard(
                job = sampleJobs[0],
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            JobCard(
                job = sampleJobs[1],
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            
            Spacer(modifier = Modifier.height(100.dp)) // Extra space for navigation
        }
    }
}

@Composable
fun JobSwipingScreen(modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxSize().background(BackgroundGray)) {
        BlueHeader(showLogo = true)
        
        Box(
            modifier = Modifier
                .fillMaxSize()
                .offset(y = (-30).dp)
                .padding(horizontal = 24.dp),
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(480.dp),
                shape = RoundedCornerShape(30.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
            ) {
                Column {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(260.dp)
                            .padding(16.dp)
                            .clip(RoundedCornerShape(24.dp))
                            .background(LightBlueBg),
                        contentAlignment = Alignment.Center,
                    ) {
                        StageLinkIcon(resId = R.drawable.logo, tint = PrimaryBlue, modifier = Modifier.size(80.dp))
                    }
                    
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Pianiste de Jazz - Blue Note Club",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextBlack,
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            StageLinkIcon(resId = R.drawable.ic_search, modifier = Modifier.size(16.dp), tint = TextGray)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Paris, Montmartre", color = TextGray, fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            StageLinkIcon(resId = R.drawable.ic_edit, modifier = Modifier.size(16.dp), tint = TextGray)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Improvisation, Soloist", color = TextGray, fontSize = 14.sp)
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                        ) {
                            IconButton(
                                onClick = {},
                                modifier = Modifier
                                    .size(56.dp)
                                    .background(RedBadge.copy(alpha = 0.1f), CircleShape),
                            ) {
                                StageLinkIcon(resId = R.drawable.ic_close, tint = RedBadge, modifier = Modifier.size(24.dp))
                            }
                            IconButton(
                                onClick = {},
                                modifier = Modifier
                                    .size(56.dp)
                                    .background(PrimaryBlue.copy(alpha = 0.1f), CircleShape),
                            ) {
                                StageLinkIcon(resId = R.drawable.ic_check, tint = PrimaryBlue, modifier = Modifier.size(24.dp))
                            }
                        }
                    }
                }
            }
            
            // Interaction buttons at the very bottom
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 32.dp)
                    .fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
            ) {
                GradientIconButton(
                    resId = R.drawable.ic_close,
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(20.dp)),
                ) { }
                GradientIconButton(
                    resId = R.drawable.ic_check,
                    modifier = Modifier
                        .size(64.dp)
                        .clip(RoundedCornerShape(20.dp)),
                ) { }
            }
        }
    }
}

@Composable
fun MessagesScreen(
    modifier: Modifier = Modifier,
    onMessageClick: (MessageInfo) -> Unit = {},
) {
    var searchQuery by rememberSaveable { mutableStateOf("") }
    val filteredMessages = remember(searchQuery) {
        sampleMessages.filter { 
            (it.name.contains(searchQuery, ignoreCase = true)) || 
            (it.snippet.contains(searchQuery, ignoreCase = true))
        }
    }

    Column(modifier = modifier.fillMaxSize().background(BackgroundGray)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .background(
                    brush = BrandGradient,
                    shape = RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp),
                )
                .padding(horizontal = 24.dp, vertical = 24.dp),
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "Messages",
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(Color.White.copy(alpha = 0.2f), CircleShape)
                            .clickable { },
                        contentAlignment = Alignment.Center,
                    ) {
                        StageLinkIcon(resId = R.drawable.ic_edit, tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Professional Search Bar
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Recherche...", color = Color.White.copy(alpha = 0.6f)) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(26.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White.copy(alpha = 0.15f),
                        unfocusedContainerColor = Color.White.copy(alpha = 0.15f),
                        focusedBorderColor = Color.Transparent,
                        unfocusedBorderColor = Color.Transparent,
                        cursorColor = Color.White,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                    ),
                    leadingIcon = { StageLinkIcon(resId = R.drawable.ic_search, tint = Color.White.copy(alpha = 0.6f), modifier = Modifier.size(20.dp)) },
                    singleLine = true,
                )
            }
        }
        
        Column(
            modifier = Modifier
                .offset(y = (-20).dp)
                .fillMaxSize()
                .background(Color.White, RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp)),
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(top = 24.dp, start = 16.dp, end = 16.dp, bottom = 100.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(filteredMessages) { message ->
                    MessageItem(
                        message = message,
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .clickable { onMessageClick(message) },
                    )
                }
            }
        }
    }
}

@Composable
fun ChatDetailScreen(
    message: MessageInfo,
    onBack: () -> Unit,
    onCall: () -> Unit,
    onVideoCall: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {
        // Chat Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    brush = Brush.verticalGradient(listOf(PrimaryBlue, SecondaryBlue)),
                    shape = RoundedCornerShape(bottomStart = 25.dp, bottomEnd = 25.dp),
                )
                .padding(start = 16.dp, top = 24.dp, end = 16.dp, bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StageLinkIcon(
                resId = R.drawable.ic_close, // Using close as back for simplicity
                tint = Color.White,
                modifier = Modifier
                    .size(24.dp)
                    .clickable { onBack() },
            )
            Spacer(modifier = Modifier.width(16.dp))
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(Color.White.copy(alpha = 0.2f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    message.name.take(1),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(message.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                if (message.isOnline) {
                    Text("Online", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)
                }
            }
            
            IconButton(onClick = onCall) {
                StageLinkIcon(resId = R.drawable.ic_call, tint = Color.White, modifier = Modifier.size(24.dp))
            }
            IconButton(onClick = onVideoCall) {
                StageLinkIcon(resId = R.drawable.ic_videocam, tint = Color.White, modifier = Modifier.size(24.dp))
            }
        }
        
        // Chat Content (Empty for now)
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            Text(
                "Conversation with ${message.name}",
                modifier = Modifier.align(Alignment.Center),
                color = TextGray,
            )
        }
        
        // Bottom Message Input
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
                .height(56.dp)
                .border(1.dp, Color.LightGray.copy(alpha = 0.5f), RoundedCornerShape(28.dp))
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                stringResource(R.string.type_message_hint),
                color = Color.LightGray,
                modifier = Modifier.weight(1f),
            )
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(PrimaryBlue, CircleShape)
                    .clickable { },
                contentAlignment = Alignment.Center,
            ) {
                StageLinkIcon(resId = R.drawable.ic_send, tint = Color.White, modifier = Modifier.size(20.dp).offset(x = 1.dp))
            }
        }
    }
}


@Composable
fun CallScreen(
    mode: CallMode,
    contact: MessageInfo,
    onEndCall: () -> Unit,
) {
    val gradientBrush = Brush.verticalGradient(
        colors = listOf(SecondaryBlue.copy(alpha = 0.9f), PrimaryBlue),
        startY = 0f,
        endY = Float.POSITIVE_INFINITY,
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(if (mode == CallMode.VIDEO) Color.Black else Color.White),
    ) {
        // Background Decorative Elements (Brand Motif)
        if (mode == CallMode.AUDIO) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(gradientBrush),
            )
            // Decorative circles echoing the logo corners
            Box(
                modifier = Modifier
                    .size(400.dp)
                    .offset(x = (-100).dp, y = (-100).dp)
                    .background(Color.White.copy(alpha = 0.05f), CircleShape),
            )
            Box(
                modifier = Modifier
                    .size(300.dp)
                    .align(Alignment.BottomEnd)
                    .offset(x = 50.dp, y = 100.dp)
                    .background(Color.White.copy(alpha = 0.05f), CircleShape),
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.height(60.dp))
            
            // Large Branded Avatar
            Box(contentAlignment = Alignment.Center) {
                // Outer ring
                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .border(2.dp, Color.White.copy(alpha = 0.3f), CircleShape),
                )
                // Inner avatar
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .background(Color.White.copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        contact.name.take(1),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 56.sp,
                    )
                }
                
                // Pulsing effect placeholder
                if (mode == CallMode.AUDIO) {
                    Box(
                        modifier = Modifier
                            .size(180.dp)
                            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape),
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Text(
                contact.name,
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                textAlign = TextAlign.Center,
            )
            Text(
                stringResource(R.string.calling_status),
                color = Color.White.copy(alpha = 0.7f),
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
            )
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Control Panel with Branded Styling
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 48.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                // Mic Toggle
                CallActionButton(
                    resId = R.drawable.ic_mic,
                    backgroundColor = Color.White.copy(alpha = 0.2f),
                    iconColor = Color.White,
                )
                
                // End Call - Main Action
                CallActionButton(
                    resId = R.drawable.ic_call_end,
                    backgroundColor = RedBadge,
                    iconColor = Color.White,
                    size = 80.dp,
                    onClick = onEndCall,
                )
                
                // Video/Speaker Toggle
                CallActionButton(
                    resId = if (mode == CallMode.VIDEO) R.drawable.ic_videocam else R.drawable.ic_call,
                    backgroundColor = Color.White.copy(alpha = 0.2f),
                    iconColor = Color.White,
                )
            }
        }
    }
}

@Composable
fun CallActionButton(
    resId: Int,
    backgroundColor: Color,
    iconColor: Color,
    size: Dp = 64.dp,
    onClick: () -> Unit = {},
) {
    Box(
        modifier = Modifier
            .size(size)
            .background(backgroundColor, CircleShape)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        StageLinkIcon(resId = resId, tint = iconColor, modifier = Modifier.size(size * 0.45f))
    }
}

enum class CallMode { AUDIO, VIDEO }

@Composable
fun StageLinkLogo(modifier: Modifier = Modifier) {
    Image(
        painter = painterResource(id = R.drawable.logo),
        contentDescription = "StageLink Logo",
        modifier = modifier
            .size(160.dp)
            .clip(RoundedCornerShape(32.dp)),
        contentScale = ContentScale.Fit,
    )
}

@Composable
fun StageLinkLogoSmall(modifier: Modifier = Modifier) {
    Image(
        painter = painterResource(id = R.drawable.logo),
        contentDescription = "StageLink Logo Small",
        modifier = modifier.size(40.dp),
        contentScale = ContentScale.Fit,
    )
}

@Composable
fun BlueHeader(
    modifier: Modifier = Modifier,
    showLogo: Boolean = false,
    content: @Composable () -> Unit = {},
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(140.dp)
            .background(
                brush = Brush.verticalGradient(listOf(PrimaryBlue, SecondaryBlue)),
                shape = RoundedCornerShape(bottomStart = 30.dp, bottomEnd = 30.dp),
            ),
        contentAlignment = Alignment.TopCenter,
    ) {
        if (showLogo) {
            StageLinkLogoSmall(modifier = Modifier.padding(top = 16.dp))
        }
        content()
    }
}

@Composable
fun StoryListView(modifier: Modifier = Modifier) {
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        item {
            StoryItem(name = "Alex", isMe = true)
        }
        items(sampleStories) { story ->
            StoryItem(name = story.name, hasUpdate = story.hasUpdate)
        }
    }
}

@Composable
fun StoryItem(
    modifier: Modifier = Modifier,
    name: String,
    hasUpdate: Boolean = false,
    isMe: Boolean = false,
) {
    Column(
        modifier = modifier.padding(horizontal = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(contentAlignment = Alignment.Center) {
            // Story Ring
            if (hasUpdate) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .border(2.5.dp, BrandGradient, CircleShape),
                )
            } else if (!isMe) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .border(1.dp, Color.LightGray.copy(alpha = 0.5f), CircleShape),
                )
            } else {
                // Background for "Me" if no ring
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .background(Color.Transparent, CircleShape),
                )
            }
            
            // Avatar
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .background(Color.LightGray.copy(alpha = 0.1f), CircleShape)
                    .border(2.dp, Color.White, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    name.take(1),
                    color = PrimaryBlue,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = if (isMe) stringResource(R.string.my_status) else name.split(" ").first(),
            color = if (hasUpdate) Color.Black else TextGray,
            fontSize = 11.sp,
            fontWeight = if (hasUpdate) FontWeight.Bold else FontWeight.Medium,
            maxLines = 1,
            textAlign = TextAlign.Center,
            modifier = Modifier.width(70.dp),
        )
    }
}

@Composable
fun PublishBar(modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .background(BackgroundGray, RoundedCornerShape(26.dp))
            .clickable { }
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .background(BrandGradient, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            StageLinkIcon(resId = R.drawable.ic_edit, modifier = Modifier.size(16.dp), tint = Color.White)
        }
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            "Partager une annonce ou une nouveauté musical...",
            color = TextGray,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
        )
    }
}

@Composable
fun GradientButton(
    modifier: Modifier = Modifier,
    text: String = "",
    onClick: () -> Unit = {},
) {
    Button(
        onClick = onClick,
        modifier = modifier.height(50.dp),
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
        contentPadding = PaddingValues(),
        shape = RoundedCornerShape(25.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = BrandGradientHorizontal,
                    shape = RoundedCornerShape(25.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Text(text, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
fun GradientIconButton(
    modifier: Modifier = Modifier,
    resId: Int? = null,
    onClick: () -> Unit = {},
) {
    Box(
        modifier = modifier
            .size(60.dp)
            .background(
                brush = Brush.verticalGradient(listOf(PrimaryBlue, SecondaryBlue)),
                shape = RoundedCornerShape(15.dp),
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        StageLinkIcon(resId = resId, tint = Color.White, modifier = Modifier.size(30.dp))
    }
}

@Composable
fun JobCard(
    modifier: Modifier = Modifier,
    job: JobInfo,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        border = BorderStroke(1.dp, Color.LightGray.copy(alpha = 0.3f)),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(50.dp)
                        .background(Color.Black, RoundedCornerShape(10.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(job.company.take(1), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(job.title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(job.company, color = TextGray, fontSize = 14.sp)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                StageLinkIcon(resId = R.drawable.ic_search, modifier = Modifier.size(16.dp), tint = TextGray)
                Text(" ${job.location}", color = TextGray, fontSize = 14.sp)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                StageLinkIcon(resId = R.drawable.ic_edit, modifier = Modifier.size(16.dp), tint = TextGray)
                Text(" Apply by ${job.deadline}", color = TextGray, fontSize = 14.sp)
            }
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedButton(
                onClick = {},
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, PrimaryBlue),
            ) {
                Text(stringResource(R.string.add_to_favorites), color = PrimaryBlue)
            }
        }
    }
}

@Composable
fun MessageItem(
    modifier: Modifier = Modifier,
    message: MessageInfo,
) {
    val backgroundColor = if (message.unreadCount > 0) PrimaryBlue.copy(alpha = 0.05f) else Color.Transparent

    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(backgroundColor)
            .padding(vertical = 12.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box {
            // Avatar with Initials
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .background(
                        brush = Brush.linearGradient(listOf(SecondaryBlue, PrimaryBlue)),
                        shape = CircleShape,
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    message.name.split(" ").asSequence().mapNotNull { it.firstOrNull()?.toString() }.joinToString("").take(2),
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                )
            }
            
            // Online Status Indicator
            if (message.isOnline) {
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .align(Alignment.BottomEnd)
                        .background(Color.White, CircleShape)
                        .padding(2.dp)
                        .background(Color(0xFF4CAF50), CircleShape),
                )
            }
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                message.name,
                fontWeight = if (message.unreadCount > 0) FontWeight.ExtraBold else FontWeight.Bold,
                fontSize = 16.sp,
                color = Color.Black,
            )
            Text(
                message.snippet,
                color = if (message.unreadCount > 0) Color.Black else TextGray,
                fontSize = 14.sp,
                maxLines = 1,
                lineHeight = 18.sp,
                fontWeight = if (message.unreadCount > 0) FontWeight.Medium else FontWeight.Normal,
            )
        }
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Column(
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                message.time,
                color = if (message.unreadCount > 0) PrimaryBlue else TextGray,
                fontSize = 12.sp,
                fontWeight = if (message.unreadCount > 0) FontWeight.Bold else FontWeight.Normal,
            )
            if (message.unreadCount > 0) {
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .background(RedBadge, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        message.unreadCount.toString(),
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            } else {
                Spacer(modifier = Modifier.size(22.dp))
            }
        }
    }
}

// Data models
data class JobInfo(val title: String, val company: String, val location: String, val deadline: String)
data class MessageInfo(
    val name: String, 
    val snippet: String, 
    val time: String, 
    val unreadCount: Int,
    val isOnline: Boolean = false,
)
data class StoryInfo(val name: String, val hasUpdate: Boolean = false)

val sampleJobs = listOf(
    JobInfo("Ingénieur du Son", "Studio Harmony", "Paris, France", "30 Nov"),
    JobInfo("Producteur de Musique", "Blue Note Records", "Lyon, France", "15 Déc"),
)

val sampleMessages = listOf(
    MessageInfo("Marc Solal", "Salut Alex, ton dernier morceau est incroyable !", "1h", 1, isOnline = true),
    MessageInfo("Studio Harmony", "Ton mixage final est prêt pour écoute.", "Hier", 0, isOnline = false),
    MessageInfo("Léa Martin", "On cherche un batteur pour le concert de vendredi.", "10m", 1, isOnline = true),
    MessageInfo("Blue Note", "Nouveau contrat de licence disponible.", "2j", 0, isOnline = false),
    MessageInfo("Julien", "Dispo pour une session de jam demain ?", "5m", 0, isOnline = false),
)

val sampleStories = listOf(
    StoryInfo("Marc", hasUpdate = true),
    StoryInfo("Blue Note", hasUpdate = true),
    StoryInfo("Léa", hasUpdate = false),
    StoryInfo("Julien", hasUpdate = false),
    StoryInfo("Studio", hasUpdate = false),
)


@Composable
fun ProfileScreen(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BackgroundGray)
            .verticalScroll(rememberScrollState()),
    ) {
        BlueHeader(
            showLogo = true,
        ) {
            Text(
                "Mon Profil",
                color = Color.White,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 16.dp),
            )
        }
        
        Column(
            modifier = Modifier
                .offset(y = (-30).dp)
                .fillMaxSize()
                .background(Color.White, RoundedCornerShape(topStart = 30.dp, topEnd = 30.dp))
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // Profile Header
            Box(contentAlignment = Alignment.BottomEnd) {
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .background(LightBlueBg, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("MS", color = PrimaryBlue, fontWeight = FontWeight.Bold, fontSize = 32.sp)
                }
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .background(PrimaryBlue, CircleShape)
                        .border(2.dp, Color.White, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    StageLinkIcon(resId = R.drawable.logo, tint = Color.White, modifier = Modifier.size(14.dp))
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("Marc Solal", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp)
            
            Surface(
                modifier = Modifier.padding(top = 8.dp),
                color = Color(0xFFFFF9C4),
                shape = RoundedCornerShape(12.dp),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    StageLinkIcon(resId = R.drawable.ic_heart, tint = Color(0xFFFBC02D), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Premium", color = Color(0xFFFBC02D), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                ProfileStat("12.5k", "Fans")
                ProfileStat("14", "Titres")
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            ProfileMenuItem("Royalties", "€ 1250.00 ce mois", R.drawable.ic_send)
            ProfileMenuItem("Concerts en Direct", "Organiser un Live", R.drawable.ic_videocam)
            ProfileMenuItem("Collaborations Studio", "Nouvel EP", R.drawable.ic_add)
            
            Spacer(modifier = Modifier.height(24.dp))
            
            GradientButton(text = "Gérer mon Abonnement Premium", modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
fun ProfileStat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp)
        Text(label, color = TextGray, fontSize = 14.sp)
    }
}

@Composable
fun ProfileMenuItem(title: String, subtitle: String, iconRes: Int) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp)
            .background(BackgroundGray, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color.White, RoundedCornerShape(10.dp)),
            contentAlignment = Alignment.Center,
        ) {
            StageLinkIcon(resId = iconRes, tint = PrimaryBlue, modifier = Modifier.size(20.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Text(subtitle, color = PrimaryBlue, fontSize = 14.sp, fontWeight = FontWeight.Medium)
        }
        StageLinkIcon(resId = R.drawable.ic_add, tint = TextGray, modifier = Modifier.size(16.dp)) // Placeholder for chevron
    }
}

@Preview(showBackground = true)
@Composable
fun StageLinkAppPreview() {
    StageLinkApp()
}
