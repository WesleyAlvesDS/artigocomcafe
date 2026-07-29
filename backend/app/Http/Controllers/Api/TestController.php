<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TestController extends Controller
{
    public function index() { return response()->json(['message' => 'API ready']); }
    public function store(Request $r) { return response()->json(['message' => 'store']); }
    public function show($id) { return response()->json(['message' => 'show']); }
    public function update(Request $r, $id) { return response()->json(['message' => 'update']); }
    public function destroy($id) { return response()->json(['message' => 'destroy']); }
}
