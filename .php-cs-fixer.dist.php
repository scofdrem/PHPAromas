<?php

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12' => true,
        'array_syntax' => ['syntax' => 'short'],
        'binary_operator_spaces' => ['operators' => ['=>' => 'align']],
        'blank_line_after_namespace' => true,
        'braces' => ['allow_single_line_closure' => true],
        'cast_spaces' => true,
        'concat_space' => ['spacing' => 'one'],
        'function_typehint_space' => true,
        'hash_to_slash_comment' => true,
        'lowercase_cast' => true,
        'method_argument_space' => ['keep_multiple_spaces_after_comma' => true],
        'method_separation' => true,
        'native_function_casing' => true,
        'new_with_braces' => true,
        'no_alias_functions' => true,
        'no_blank_lines_after_class_opening' => true,
        'no_empty_statement' => true,
        'no_extra_consecutive_blank_lines' => true,
        'no_leading_import_slash' => true,
        'no_leading_namespace_whitespace' => true,
        'no_multiline_whitespace_around_double_arrow' => true,
        'no_php4_constructor' => true,
        'no_short_bool_cast' => true,
        'no_singleline_whitespace_before_semicolons' => true,
        'no_superfluous_elseif' => true,
        'no_trailing_comma_in_list_call' => true,
        'no_trailing_whitespace' => true,
        'no_unneeded_control_parentheses' => true,
        'no_unreachable_default_argument_value' => true,
        'no_useless_else' => true,
        'no_useless_return' => true,
        'no_whitespace_before_comma_in_array' => true,
        'normalize_index_brace' => true,
        'object_operator_without_whitespace' => true,
        'php_unit_fqcn_annotation' => true,
        'phpdoc_indent' => true,
        'phpdoc_no_access' => true,
        'phpdoc_no_empty_return' => true,
        'phpdoc_no_package' => true,
        'phpdoc_scalar' => true,
        'phpdoc_summary' => true,
        'phpdoc_to_comment' => true,
        'phpdoc_trim' => true,
        'phpdoc_types' => true,
        'phpdoc_var_without_name' => true,
        'php_unit_internal_class' => true,
        'php_unit_ordered_covers' => true,
        'return_type_declaration' => ['space_before' => 'one'],
        'single_blank_line_before_namespace' => true,
        'single_trait_insert_per_statement' => true,
        'space_after_semicolon' => ['break_in_for_and_foreach' => false],
        'standardize_not_equals' => true,
        'ternary_operator_spaces' => true,
        'trailing_comma_in_multiline' => ['elements' => ['arrays']],
        'trim_array_spaces' => true,
        'unary_operator_spaces' => true,
        'visibility_required' => ['elements' => ['property', 'method', 'constant']],
        'whitespace_after_comma_in_array' => true,
    ])
    ->setFinder(
        PhpCsFixer\Finder::create()
            ->in(__DIR__ . '/app')
            ->in(__DIR__ . '/config')
            ->in(__DIR__ . '/database')
            ->in(__DIR__ . '/routes')
            ->in(__DIR__ . '/tests')
            ->notPath('vendor')
    );