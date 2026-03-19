python3 -c "
f = open('src/Sound.py', 'w')
f.write('''import pygame

class Sound:

    def __init__(self, path):
        self.path = path
        try:
            pygame.mixer.init()
            self.sound = pygame.mixer.Sound(path)
        except Exception:
            self.sound = None

    def play(self):
        try:
            if self.sound:
                pygame.mixer.Sound.play(self.sound)
        except Exception:
            pass
''')
f.close()
print('Fixed!')
"
