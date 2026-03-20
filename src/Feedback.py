class Feedback:
    def __init__(self):
        self.message = ""
        self.color = (255, 255, 255)
        self.timer = 0

    def evaluate_move(self, before, after, player):
        diff = after - before if player == 'white' else before - after

        if diff > 0.5:
            self.message = "Great move!"
            self.color = (0, 200, 0)
        elif diff < -0.5:
            self.message = "Mistake!"
            self.color = (200, 0, 0)
        else:
            self.message = "Okay move"
            self.color = (200, 200, 0)

        self.timer = 120

    def show(self, screen):
        if self.timer > 0:
            import pygame
            font = pygame.font.SysFont('monospace', 22, bold=True)
            label = font.render(self.message, True, self.color)
            screen.blit(label, (20, 20))
            self.timer -= 1