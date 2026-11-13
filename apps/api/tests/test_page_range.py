import pytest

from pdf_tools_api.converters.page_range import parse_page_selection
from pdf_tools_api.core.exceptions import AppError


def test_parse_single_and_ranges() -> None:
    assert parse_page_selection("1", page_count=10, max_selected=50) == [0]
    assert parse_page_selection("1-3", page_count=10, max_selected=50) == [0, 1, 2]
    assert parse_page_selection("1,3,5", page_count=10, max_selected=50) == [0, 2, 4]
    assert parse_page_selection("1-3,5,8-10", page_count=12, max_selected=50) == [
        0,
        1,
        2,
        4,
        7,
        8,
        9,
    ]


def test_reject_invalid() -> None:
    with pytest.raises(AppError):
        parse_page_selection("0", page_count=5, max_selected=50)
    with pytest.raises(AppError):
        parse_page_selection("3-1", page_count=5, max_selected=50)
    with pytest.raises(AppError):
        parse_page_selection("99", page_count=5, max_selected=50)
