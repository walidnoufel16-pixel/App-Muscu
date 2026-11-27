// Photos des exercices : chaque fichier annoncé existe, et les exercices courants sont illustrés.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  final carte = jsonDecode(File('assets/photos.json').readAsStringSync()) as Map<String, dynamic>;
  test('chaque photo annoncée est dans assets/photos', () {
    final manquantes = [
      for (final e in carte.entries)
        if (e.value['f'] != null && !File('assets/photos/${e.value['f']}').existsSync()) e.key,
    ];
    expect(manquantes, isEmpty);
  });
  test('les exercices courants ont leur photo', () {
    for (final id in ['dc', 'sq', 'tr', 'pomp', 'dip']) {
      expect(carte[id], isNotNull, reason: id);
    }
  });
}
