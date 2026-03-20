import pygame
from const import *


class Menu:

    def __init__(self, screen):
        self.screen = screen
        self.font_title = pygame.font.SysFont('monospace', 52, bold=True)
        self.font_sub = pygame.font.SysFont('monospace', 20)
        self.font_option = pygame.font.SysFont('monospace', 28, bold=True)
        self.font_small = pygame.font.SysFont('monospace', 16)

    def show(self):
        '''Main menu. Returns (mode, difficulty).'''
        while True:
            self.screen.fill((20, 20, 20))

            title = self.font_title.render('CHESS TUTOR', True, (255, 255, 255))
            self.screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 90))

            sub = self.font_sub.render('Learn chess the fun way', True, (150, 150, 150))
            self.screen.blit(sub, (WIDTH // 2 - sub.get_width() // 2, 158))

            options = [
                ('1.  Player vs Player', 'pvp',    (200, 200, 200)),
                ('2.  Player vs AI',     'ai',     (200, 200, 200)),
                ('3.  Puzzle Mode',      'puzzle', (255, 215, 0)),
            ]

            mouse = pygame.mouse.get_pos()
            rects = []
            y = 250
            for label, mode, base_color in options:
                lbl = self.font_option.render(label, True, base_color)
                rect = lbl.get_rect(center=(WIDTH // 2, y))
                color = (255, 255, 100) if rect.collidepoint(mouse) else base_color
                lbl = self.font_option.render(label, True, color)
                self.screen.blit(lbl, rect)
                rects.append((rect, mode))
                y += 75

            hint = self.font_small.render(
                'Click or press 1, 2, 3', True, (80, 80, 80))
            self.screen.blit(hint, (WIDTH // 2 - hint.get_width() // 2, HEIGHT - 50))

            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    quit()
                if event.type == pygame.MOUSEBUTTONDOWN:
                    for rect, mode in rects:
                        if rect.collidepoint(event.pos):
                            if mode == 'pvp':
                                return ('pvp', 'medium')
                            return self._difficulty_menu(mode)
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_1:
                        return ('pvp', 'medium')
                    if event.key == pygame.K_2:
                        return self._difficulty_menu('ai')
                    if event.key == pygame.K_3:
                        return self._difficulty_menu('puzzle')

    def _difficulty_menu(self, mode):
        '''Difficulty picker. Returns (mode, difficulty).'''
        labels = {
            'ai':     'SELECT AI DIFFICULTY',
            'puzzle': 'SELECT PUZZLE DIFFICULTY',
        }
        while True:
            self.screen.fill((20, 20, 20))

            title = self.font_option.render(
                labels.get(mode, 'SELECT DIFFICULTY'), True, (255, 255, 255))
            self.screen.blit(title, (WIDTH // 2 - title.get_width() // 2, 110))

            options = [
                ('1.  Easy',   'easy',   (0, 200, 0),
                 'Random moves — perfect for beginners'),
                ('2.  Medium', 'medium', (255, 165, 0),
                 'Decent AI — a real challenge'),
                ('3.  Hard',   'hard',   (220, 50, 50),
                 'Strong AI — good luck!'),
            ]

            mouse = pygame.mouse.get_pos()
            rects = []
            y = 220
            for label, diff, color, desc in options:
                lbl = self.font_option.render(label, True, color)
                rect = lbl.get_rect(center=(WIDTH // 2, y))
                if rect.collidepoint(mouse):
                    pygame.draw.rect(self.screen, (40, 40, 40),
                                     rect.inflate(24, 12), border_radius=6)
                self.screen.blit(lbl, rect)
                desc_lbl = self.font_small.render(desc, True, (140, 140, 140))
                self.screen.blit(desc_lbl,
                    (WIDTH // 2 - desc_lbl.get_width() // 2, y + 36))
                rects.append((rect, diff))
                y += 105

            back = self.font_small.render('B - Back', True, (80, 80, 80))
            self.screen.blit(back, (WIDTH // 2 - back.get_width() // 2, HEIGHT - 50))

            pygame.display.update()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    quit()
                if event.type == pygame.MOUSEBUTTONDOWN:
                    for rect, diff in rects:
                        if rect.collidepoint(event.pos):
                            return (mode, diff)
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_1:
                        return (mode, 'easy')
                    if event.key == pygame.K_2:
                        return (mode, 'medium')
                    if event.key == pygame.K_3:
                        return (mode, 'hard')
                    if event.key == pygame.K_b:
                        return self.show()