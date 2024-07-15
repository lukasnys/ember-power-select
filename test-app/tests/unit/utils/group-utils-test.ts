import {
  isGroup,
  indexOfOption,
  pathForOption,
  optionAtIndex,
  filterOptions,
  stripDiacritics,
  countOptions,
  defaultTypeAheadMatcher,
  copyGroup,
  type MatcherFn,
} from 'ember-power-select/utils/group-utils';
import { module, test } from 'qunit';

const groupedOptions = [
  { groupName: 'Smalls', options: ['zero', 'one', 'two', 'three'] },
  { groupName: 'Mediums', options: ['four', 'five', 'six'] },
  {
    groupName: 'Bigs',
    options: [
      { groupName: 'Fairly big', options: ['seven', 'eight', 'nine'] },
      { groupName: 'Really big', options: ['ten', 'eleven', 'twelve'] },
      'thirteen',
    ],
  },
  'one hundred',
  'one thousand',
];
const groupedOptionsWithDisabledThings = [
  {
    groupName: 'Smalls',
    options: ['zero', { disabled: true, value: 'one' }, 'two', 'three'],
  },
  { groupName: 'Mediums', options: ['four', 'five', 'six'] },
  {
    groupName: 'Bigs',
    disabled: true,
    options: [
      { groupName: 'Fairly big', options: ['seven', 'eight', 'nine'] },
      { groupName: 'Really big', options: ['ten', 'eleven', 'twelve'] },
      'thirteen',
    ],
  },
  'one hundred',
  'one thousand',
];
const basicOptions = ['zero', 'one', 'two', 'three', 'four', 'five'];

module('Unit | Utility | Group utils', function () {
  test('#isGroup returns true when the given options has `groupName` and `options`', function (assert) {
    assert.notOk(isGroup({}));
    assert.notOk(isGroup({ id: 1, text: 'hello' }));
    assert.notOk(isGroup({ groupName: 1, noOptions: 'hello' }));
    assert.notOk(isGroup({ other: 1, options: ['a', 'b'] }));
    assert.ok(isGroup({ groupName: 1, options: ['a', 'b'] }));
  });

  test('#indexOfOption returns the index of an option among all', function (assert) {
    assert.strictEqual(indexOfOption(basicOptions, 'zero'), 0);
    assert.strictEqual(indexOfOption(basicOptions, 'five'), 5);
    assert.strictEqual(indexOfOption(basicOptions, 'six'), -1);
    assert.strictEqual(indexOfOption(basicOptions, null), -1);
  });

  test('#indexOfOption also works transversing groups', function (assert) {
    assert.strictEqual(indexOfOption(groupedOptions, 'zero'), 0);
    assert.strictEqual(indexOfOption(groupedOptions, 'six'), 6);
    assert.strictEqual(indexOfOption(groupedOptions, 'seven'), 7);
    assert.strictEqual(indexOfOption(groupedOptions, 'twelve'), 12);
    assert.strictEqual(indexOfOption(groupedOptions, 'thirteen'), 13);
    assert.strictEqual(indexOfOption(groupedOptions, 'one thousand'), 15);
    assert.strictEqual(indexOfOption(groupedOptions, null), -1);
  });

  test('#pathForOption works for simple lists with no nesting', function (assert) {
    assert.strictEqual(pathForOption(null, null), '');
    assert.strictEqual(pathForOption(basicOptions, null), '');
    assert.strictEqual(pathForOption(basicOptions, ''), '');
    assert.strictEqual(pathForOption(basicOptions, 'non-existant option'), '');
    assert.strictEqual(pathForOption(basicOptions, 'zero'), '0');
    assert.strictEqual(pathForOption(basicOptions, 'one'), '1');
    assert.strictEqual(pathForOption(basicOptions, 'five'), '5');
  });

  test('#pathForOption works for nested lists', function (assert) {
    assert.strictEqual(pathForOption(groupedOptions, 'zero'), '0.0');
    assert.strictEqual(pathForOption(groupedOptions, 'four'), '1.0');
    assert.strictEqual(pathForOption(groupedOptions, 'seven'), '2.0.0');
    assert.strictEqual(pathForOption(groupedOptions, 'ten'), '2.1.0');
    assert.strictEqual(pathForOption(groupedOptions, 'one hundred'), '3');
    assert.strictEqual(pathForOption(groupedOptions, 'one thousand'), '4');
  });

  test('#optionAtIndex returns an object `{ disabled, option }`, disabled being true if that option or any ancestor is disabled, and the option will be undefined if the index is out of range', function (assert) {
    assert.deepEqual(optionAtIndex(basicOptions, 0), {
      disabled: false,
      option: 'zero',
    });
    assert.deepEqual(optionAtIndex(basicOptions, 5), {
      disabled: false,
      option: 'five',
    });
    assert.deepEqual(optionAtIndex(basicOptions, 7), {
      disabled: false,
      option: undefined,
    });
    assert.deepEqual(optionAtIndex(basicOptions, -1), {
      disabled: false,
      option: undefined,
    }); // Should this return the last??
  });

  test('#optionAtIndex knows how to transverse groups', function (assert) {
    assert.deepEqual(optionAtIndex(groupedOptions, 0), {
      disabled: false,
      option: 'zero',
    });
    assert.deepEqual(optionAtIndex(groupedOptions, 6), {
      disabled: false,
      option: 'six',
    });
    assert.deepEqual(optionAtIndex(groupedOptions, 7), {
      disabled: false,
      option: 'seven',
    });
    assert.deepEqual(optionAtIndex(groupedOptions, 12), {
      disabled: false,
      option: 'twelve',
    });
    assert.deepEqual(optionAtIndex(groupedOptions, 13), {
      disabled: false,
      option: 'thirteen',
    });
    assert.deepEqual(optionAtIndex(groupedOptions, 15), {
      disabled: false,
      option: 'one thousand',
    });
    assert.deepEqual(optionAtIndex(groupedOptions, 16), {
      disabled: false,
      option: undefined,
    });
    assert.deepEqual(optionAtIndex(groupedOptions, -1), {
      disabled: false,
      option: undefined,
    });
  });

  test('#optionAtIndex knows that an option is disabled if an ancestor is disabled', function (assert) {
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 0), {
      disabled: false,
      option: 'zero',
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 1), {
      disabled: true,
      option: { disabled: true, value: 'one' },
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 6), {
      disabled: false,
      option: 'six',
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 7), {
      disabled: true,
      option: 'seven',
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 12), {
      disabled: true,
      option: 'twelve',
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 13), {
      disabled: true,
      option: 'thirteen',
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 15), {
      disabled: false,
      option: 'one thousand',
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, 16), {
      disabled: false,
      option: undefined,
    });
    assert.deepEqual(optionAtIndex(groupedOptionsWithDisabledThings, -1), {
      disabled: false,
      option: undefined,
    });
  });

  test('#filterOptions generates new options respecting groups when the matches returns a number, taking negative numbers as "not found" and positive as matches', function (assert) {
    const matcher: MatcherFn = function (value, searchText) {
      return new RegExp(searchText, 'i').test(value) ? 0 : -1;
    };
    assert.deepEqual(filterOptions(groupedOptions, 'zero', matcher), [
      { groupName: 'Smalls', options: ['zero'] },
    ]);
    assert.deepEqual(filterOptions(groupedOptions, 'ele', matcher), [
      {
        groupName: 'Bigs',
        options: [{ groupName: 'Really big', options: ['eleven'] }],
      },
    ]);
    assert.deepEqual(filterOptions(groupedOptions, 't', matcher), [
      { groupName: 'Smalls', options: ['two', 'three'] },
      {
        groupName: 'Bigs',
        options: [
          { groupName: 'Fairly big', options: ['eight'] },
          { groupName: 'Really big', options: ['ten', 'twelve'] },
          'thirteen',
        ],
      },
      'one thousand',
    ]);
  });

  test('#filterOptions generates new options respecting groups when the matches returns a number, taking negative numbers as "not found" and positive as matches', function (assert) {
    const matcher: MatcherFn = function (value, searchText) {
      return new RegExp(searchText, 'i').test(value) ? 0 : -1;
    };
    assert.deepEqual(filterOptions(groupedOptions, 'zero', matcher), [
      { groupName: 'Smalls', options: ['zero'] },
    ]);
    assert.deepEqual(filterOptions(groupedOptions, 'ele', matcher), [
      {
        groupName: 'Bigs',
        options: [{ groupName: 'Really big', options: ['eleven'] }],
      },
    ]);
    assert.deepEqual(filterOptions(groupedOptions, 't', matcher), [
      { groupName: 'Smalls', options: ['two', 'three'] },
      {
        groupName: 'Bigs',
        options: [
          { groupName: 'Fairly big', options: ['eight'] },
          { groupName: 'Really big', options: ['ten', 'twelve'] },
          'thirteen',
        ],
      },
      'one thousand',
    ]);

    assert.deepEqual(filterOptions(groupedOptions, 'imposible', matcher), []);
    assert.deepEqual(
      filterOptions(groupedOptions, '', matcher),
      groupedOptions,
    );
  });

  test('#filterOptions skips disabled options and groups if it receives a truty values as 4th arguments', function (assert) {
    const matcher: MatcherFn = function (value, searchText) {
      return new RegExp(searchText, 'i').test(value) ? 0 : -1;
    };
    assert.deepEqual(
      filterOptions(groupedOptionsWithDisabledThings, 'zero', matcher, true),
      [{ groupName: 'Smalls', options: ['zero'] }],
    );
    assert.deepEqual(
      filterOptions(groupedOptionsWithDisabledThings, 'one', matcher, true),
      ['one hundred', 'one thousand'],
    );
    assert.deepEqual(
      filterOptions(groupedOptionsWithDisabledThings, 'ele', matcher, true),
      [],
    );
    assert.deepEqual(
      filterOptions(groupedOptionsWithDisabledThings, 't', matcher, true),
      [{ groupName: 'Smalls', options: ['two', 'three'] }, 'one thousand'],
    );

    assert.deepEqual(
      filterOptions(
        groupedOptionsWithDisabledThings,
        'imposible',
        matcher,
        true,
      ),
      [],
    );
    assert.deepEqual(
      filterOptions(groupedOptionsWithDisabledThings, '', matcher, true),
      [
        {
          groupName: 'Smalls',
          options: ['zero', 'two', 'three'],
        },
        {
          groupName: 'Mediums',
          options: ['four', 'five', 'six'],
        },
        'one hundred',
        'one thousand',
      ],
    );
  });

  test('#stripDiacritics returns the given string with diacritics normalized into simple letters', function (assert) {
    assert.strictEqual(stripDiacritics('áãàéèíìóõøòúùñ'), 'aaaeeiioooouun');
  });

  test('#stripDiacritics is able to handle integers', function (assert) {
    assert.strictEqual(stripDiacritics(1), '1');
  });

  test('#countOptions returns the number of options, transversing the groups with no depth level', function (assert) {
    assert.strictEqual(countOptions(groupedOptions), 16);
  });

  test('#copyGroup returns a new group with the same name, options and disabled', function (assert) {
    const group = {
      groupName: 'Smalls',
      options: ['zero', 'one', 'two'],
      disabled: true,
    };
    const copy = copyGroup(group, group.options);
    assert.deepEqual(copy, group);
    assert.notStrictEqual(copy, group);
  });

  test('#copyGroup returns a new group with the same name, options and disabled, as well as any other custom properties', function (assert) {
    const group = {
      groupName: 'Smalls',
      options: ['zero', 'one', 'two'],
      custom: 'property',
    };
    const copy = copyGroup(group, group.options);
    assert.deepEqual(copy, group);
    assert.notStrictEqual(copy, group);
  });
});

test('#defaultTypeAheadMatcher', function (assert) {
  assert.strictEqual(
    defaultTypeAheadMatcher('Aaron', 'Aa'),
    1,
    `Aaron is matched by Aa`,
  );
  assert.strictEqual(
    defaultTypeAheadMatcher('Álvaro', 'alv'),
    1,
    `Álvaro is matched by alv`,
  );

  assert.strictEqual(
    defaultTypeAheadMatcher('Fabiola', 'Ab'),
    -1,
    `Fabiola is not matched by Ab`,
  );
});
