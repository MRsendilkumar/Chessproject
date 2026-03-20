import asyncio
import pygame
import sys
import random
from const import *
from Game import Game
from Square import Square
from Move import Move
from Menu import Menu
from Feedback import Feedback
from ai import get_best_move, evaluate


class Main:

    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption('Chess Tutor')
        self.game = Game()

    def get_ai_depth(self, difficulty):
        if difficulty == 'easy':
            return 1
        elif difficulty == 'medium':
            return 2
        else:
            return 4

    def get_random_ai_move(self, board):
        all_moves = []
        for row in range(8):
            for col in range(8):
                if board.squares[row][col].has_piece():
                    piece = board.squares[row][col].piece
                    if piece.color == 'black':
                        board.calc_moves(piece, row, col, bool=True)
                        for move in piece.moves:
                            all_moves.append((piece, move))
        return random.choice(all_moves) if all_moves else None

    async def mainloop(self, mode, difficulty='medium'):
        screen = self.screen
        game = self.game
        board = self.game.board
        dragger = self.game.dragger
        feedback = Feedback()
        depth = self.get_ai_depth(difficulty)

        puzzle_mode = (mode == 'puzzle')
        quiz_active = False
        quiz_best_move = None
        quiz_message = ''
        quiz_color = (255, 255, 255)
        quiz_timer = 0
        moves_since_quiz = 0
        quiz_interval = 3
        font = pygame.font.SysFont('monospace', 20, bold=True)

        while True:
            screen.fill((0, 0, 0))
            game.show_bg(screen)
            game.show_last_move(screen)
            if not quiz_active:
                game.show_moves(screen)
            game.show_pieces(screen)
            game.show_hover(screen)

            if not puzzle_mode:
                feedback.show(screen)

            if quiz_active:
                self._draw_banner(screen, font,
                    'PUZZLE: Find the best move!  S = skip')

            if quiz_timer > 0:
                self._draw_message(screen, font, quiz_message, quiz_color)
                quiz_timer -= 1

            if dragger.dragging:
                dragger.update_blit(screen)

            for event in pygame.event.get():

                if event.type == pygame.MOUSEBUTTONDOWN:
                    dragger.update_mouse(event.pos)
                    clicked_row = dragger.mouseY // SQSIZE
                    clicked_col = dragger.mouseX // SQSIZE

                    if board.squares[clicked_row][clicked_col].has_piece():
                        piece = board.squares[clicked_row][clicked_col].piece
                        if piece.color == game.next_player:
                            board.calc_moves(piece, clicked_row, clicked_col, bool=True)
                            dragger.save_initial(event.pos)
                            dragger.drag_piece(piece)
                            game.show_bg(screen)
                            game.show_last_move(screen)
                            game.show_moves(screen)
                            game.show_pieces(screen)

                elif event.type == pygame.MOUSEMOTION:
                    motion_row = event.pos[1] // SQSIZE
                    motion_col = event.pos[0] // SQSIZE
                    game.set_hover(motion_row, motion_col)
                    if dragger.dragging:
                        dragger.update_mouse(event.pos)
                        game.show_bg(screen)
                        game.show_last_move(screen)
                        game.show_moves(screen)
                        game.show_pieces(screen)
                        game.show_hover(screen)
                        dragger.update_blit(screen)

                elif event.type == pygame.MOUSEBUTTONUP:
                    if dragger.dragging:
                        dragger.update_mouse(event.pos)
                        released_row = dragger.mouseY // SQSIZE
                        released_col = dragger.mouseX // SQSIZE

                        initial = Square(dragger.initial_row, dragger.initial_col)
                        final = Square(released_row, released_col)
                        move = Move(initial, final)

                        if board.valid_move(dragger.piece, move):

                            if quiz_active and puzzle_mode and quiz_best_move:
                                if (move.initial.row == quiz_best_move.initial.row and
                                    move.initial.col == quiz_best_move.initial.col and
                                    move.final.row == quiz_best_move.final.row and
                                    move.final.col == quiz_best_move.final.col):
                                    quiz_message = 'Perfect! That was the best move!'
                                    quiz_color = (0, 220, 0)
                                else:
                                    quiz_message = 'Not the best — but keep going!'
                                    quiz_color = (255, 150, 0)
                                quiz_timer = 180
                                quiz_active = False
                                moves_since_quiz = 0

                            score_before = evaluate(board)
                            captured = board.squares[released_row][released_col].has_piece()
                            board.move(dragger.piece, move)
                            board.set_true_en_passant(dragger.piece)
                            score_after = evaluate(board)

                            if not puzzle_mode:
                                feedback.evaluate_move(score_before, score_after, game.next_player)

                            game.play_sound(captured)
                            game.show_bg(screen)
                            game.show_last_move(screen)
                            game.show_pieces(screen)
                            game.next_turn()
                            moves_since_quiz += 1

                            if game.next_player == 'black':
                                await asyncio.sleep(0.3)
                                if difficulty == 'easy':
                                    result = self.get_random_ai_move(board)
                                else:
                                    result = get_best_move(board, depth=depth)

                                if result:
                                    ai_piece, ai_move = result
                                    for r in range(8):
                                        for c in range(8):
                                            if board.squares[r][c].piece is ai_piece:
                                                board.calc_moves(ai_piece, r, c, bool=True)
                                                break
                                    ai_captured = board.squares[ai_move.final.row][ai_move.final.col].has_piece()
                                    board.move(ai_piece, ai_move)
                                    game.play_sound(ai_captured)
                                    game.show_bg(screen)
                                    game.show_last_move(screen)
                                    game.show_pieces(screen)
                                    game.next_turn()

                            if puzzle_mode and moves_since_quiz >= quiz_interval and not quiz_active:
                                result = get_best_move(board, depth=2)
                                if result:
                                    _, quiz_best_move = result
                                    quiz_active = True

                    dragger.undrag_piece()

                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_s and quiz_active:
                        quiz_active = False
                        quiz_message = 'Skipped! Keep playing.'
                        quiz_color = (150, 150, 255)
                        quiz_timer = 150
                        moves_since_quiz = 0

                    if event.key == pygame.K_t:
                        game.change_theme()

                    if event.key == pygame.K_r:
                        game.reset()
                        game = self.game
                        board = self.game.board
                        dragger = self.game.dragger
                        feedback = Feedback()
                        quiz_active = False
                        moves_since_quiz = 0

                    if event.key == pygame.K_m:
                        self.__init__()
                        menu = Menu(screen)
                        mode, difficulty = menu.show()
                        await self.mainloop(mode, difficulty)
                        return

                elif event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()

            pygame.display.update()
            await asyncio.sleep(0)

    def _draw_banner(self, surface, font, text):
        banner = pygame.Surface((WIDTH, 50))
        banner.set_alpha(210)
        banner.fill((20, 20, 80))
        surface.blit(banner, (0, HEIGHT // 2 - 25))
        lbl = font.render(text, True, (255, 255, 100))
        surface.blit(lbl, (WIDTH // 2 - lbl.get_width() // 2, HEIGHT // 2 - 12))

    def _draw_message(self, surface, font, text, color):
        lbl = font.render(text, True, color)
        bg = pygame.Surface((lbl.get_width() + 20, 44))
        bg.set_alpha(200)
        bg.fill((0, 0, 0))
        surface.blit(bg, (WIDTH // 2 - lbl.get_width() // 2 - 10, 8))
        surface.blit(lbl, (WIDTH // 2 - lbl.get_width() // 2, 16))


async def main():
    app = Main()
    menu = Menu(app.screen)
    mode, difficulty = menu.show()
    await app.mainloop(mode, difficulty)


asyncio.run(main())