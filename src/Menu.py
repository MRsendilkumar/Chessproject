import pygame
from const import *

class Menu:

    def __init__(self, screen):
        self.screen = screen
        self.font_title = pygame.font.SysFont('monospace', 48, bold=True)
        self.font_option = pygame.font.SysFont('monospace', 32)

    def show(self):
        '''
        Shows the menu and returns the selected mode.
        Returns 'pvp' or 'ai'
        '''
        while True:
            self.screen.fill((40, 40, 40))

            # Title
            title = self.font_title.render('CHESS', True, (255, 255, 255))
            self.screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 150))

            # Options
            pvp = self.font_option.render('1.  Player  vs  Player', True, (200, 200, 200))
            ai  = self.font_option.render('2.  Player  vs  AI',     True, (200, 200, 200))

            pvp_rect = pvp.get_rect(center=(WIDTH // 2, 320))
            ai_rect  = ai.get_rect(center=(WIDTH // 2, 400))

            # Highlight on hover
            mouse = pygame.mouse.get_pos()
            pvp_color = (255, 255, 0) if pvp_rect.collidepoint(mouse) else (200, 200, 200)
            ai_color  = (255, 255, 0) if ai_rect.collidepoint(mouse)  else (200, 200, 200)

            pvp = self.font_option.render('1.  Player  vs  Player', True, pvp_color)
            ai  = self.font_option.render('2.  Player  vs  AI',     True, ai_color)

            self.screen.blit(pvp, pvp_rect)
            self.screen.blit(ai,  ai_rect)

            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    quit()
                if event.type == pygame.MOUSEBUTTONDOWN:
                    if pvp_rect.collidepoint(event.pos):
                        return 'pvp'
                    if ai_rect.collidepoint(event.pos):
                        return 'ai'
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_1:
                        return 'pvp'
                    if event.key == pygame.K_2:
                        return 'ai'
